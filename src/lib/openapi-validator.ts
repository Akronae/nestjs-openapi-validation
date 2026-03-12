import { BadRequestException, Paramtype } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { mapEntries } from 'radash';
import z, { ZodIssueCode, ZodSchema, ZodType } from 'zod';
import { getIgnoredOpenApiModels } from './openapi-ignore.decorator';

type OpenApiProp = {
  type?: string;
  enum?: [string, ...string[]];
  oneOf?: [OpenApiProp, OpenApiProp, ...OpenApiProp[]];
  allOf?: [OpenApiProp, OpenApiProp, ...OpenApiProp[]];
  $ref?: string;
  items?: OpenApiProp;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  properties?: Record<string, OpenApiProp>;
  required?: boolean;
  nullable?: boolean;
};

type DeepArray<T> = T | DeepArray<T>[];

type PropType<T = { name: string }> = {
  type: () => DeepArray<T> | Record<string | number, PropType<T>>;
  required: boolean;
  nullable?: boolean;
};

export class OpenApiValidatorError extends Error {}

export class OpenApiValidator {
  public schemata: Record<string, Record<string, PropType>> = {};

  constructor(
    tsMetadata: () => Promise<{
      '@nestjs/swagger': {
        models: (Promise<any> | Record<string, Record<string, PropType>>)[][];
      };
    }>,
    public readonly openapi: OpenAPIObject,
  ) {
    tsMetadata().then((res) => {
      for (const model of res['@nestjs/swagger'].models) {
        for (const classes of Object.values(model)) {
          for (const [className, fields] of Object.entries(classes)) {
            this.schemata[className] = fields as (typeof this.schemata)[string];
          }
        }
      }
    });
  }

  validate(
    value: any,
    schema: { dto: string } | ZodSchema,
    type: Paramtype | 'response',
  ) {
    const zodSchema =
      schema instanceof ZodSchema ? schema : this.getZodSchema(schema.dto);
    const res = zodSchema.safeParse(value);

    if (!res.success) {
      throw new BadRequestException({ error: { [type]: res.error } });
    }

    return res.data;
  }

  getZodSchema(dtoName: string) {
    if (getIgnoredOpenApiModels().includes(dtoName)) return z.any();

    let tsschema = this.schemata[dtoName];
    const openapischema = this.openapi.components?.schemas[
      dtoName
    ] as SchemaObject;

    if (
      Object.keys(tsschema).length == 0 &&
      Object.keys(openapischema.properties).length > 0
    ) {
      tsschema = mapEntries(openapischema.properties, (k, v) => {
        return [
          k,
          {
            required: openapischema.required.includes(k),
            type: () => ({ name: (v as SchemaObject).type }),
          },
        ];
      });
    }

    const zodSchema = z.object({
      ...mapEntries(openapischema.properties, (k, v) => {
        const ts = tsschema[k];
        const prop = v as OpenApiProp;
        const val = this.openapiPropToZod(prop, ts);

        if (!val) {
          throw new OpenApiValidatorError(
            `Unknown type: ${prop.type} for key ${k}`,
          );
        }

        return [k, val];
      }),
    });

    return zodSchema;
  }

  openapiPropToZod(prop: OpenApiProp, opts: Partial<PropType>): ZodType {
    opts ??= {};

    if (prop.oneOf?.length) {
      if (prop.oneOf.length < 2) {
        return this.openapiPropToZod(prop.oneOf[0], opts);
      }
      return z.union(
        prop.oneOf.map((o) => this.openapiPropToZod(o, { required: true })) as [
          ZodType,
          ZodType,
          ...ZodType[],
        ],
      );
    }
    if (prop.allOf?.length) {
      if (prop.allOf.length < 2) {
        return this.openapiPropToZod(prop.allOf[0], opts);
      }
      return z.intersection(
        ...(prop.allOf.map((o) =>
          this.openapiPropToZod(o, { required: true }),
        ) as [ZodType, ZodType, ...ZodType[]]),
      );
    }

    let val: ZodType;
    let type: string;

    if (prop.$ref) {
      const dtoname = prop.$ref.split('/').pop();
      val = z.preprocess(parseJsonPreprocessor, this.getZodSchema(dtoname));
      type = dtoname;
    } else {
      type = prop.type;
      val = z.unknown();

      if (prop.enum) {
        val = anyTypeEnum(prop.enum, prop.type);
      } else if (type == 'boolean') {
        val = z.preprocess((val) => {
          const s = String(val).toLowerCase();
          if (s === 'true') return true;
          if (s === 'false') return false;
          return val;
        }, z.boolean());
      } else if (type in z.coerce) {
        val = z.coerce[type]();
      } else if (type == 'array') {
        val = z.preprocess(
          (v) => (Array.isArray(v) ? v : [v]),
          z.array(this.openapiPropToZod(prop.items, opts)),
        );
      } else if (type == 'object') {
        if (!prop.properties) {
          val = z.record(
            z.union([z.string(), z.number(), z.boolean(), z.null()]),
            z.unknown(),
          );
        } else {
          val = z.object(
            mapEntries(prop.properties, (k, v) => [
              k,
              this.openapiPropToZod(v, opts.type?.()[k]),
            ]),
          );
        }
      }

      if (prop.format) {
        if (prop.format.includes('date')) {
          val = safeDate;
        } else if (val[prop.format]) {
          val = val[prop.format]();
        }
      }

      if (prop.minimum != undefined && val['min']) {
        val = val['min'](prop.minimum);
      }

      if (prop.maximum != undefined && val['max']) {
        val = val['max'](prop.maximum);
      }

      if (prop.minLength != undefined && val['min']) {
        val = val['min'](prop.minLength);
      }

      if (prop.maxLength != undefined && val['max']) {
        val = val['max'](prop.maxLength);
      }

      if (prop.pattern != undefined && val['regex']) {
        val = val['regex'](new RegExp(prop.pattern));
      }
    }

    if (type == 'string') {
      val = safeString(val);
    }

    if (!val) {
      return null;
    }
    if (opts.required === false)
      val = z.preprocess(
        (v) => (v === null || v === 'undefined' ? undefined : v),
        val.optional(),
      );
    else val = requiredrefine(val, type);

    if (opts.nullable || prop.nullable) {
      val = z.null().or(val);
    }

    return val as ZodType;
  }
}

const parseJsonPreprocessor = (value: any, ctx: z.RefinementCtx) => {
  if (typeof value === 'string') {
    const trim = value.trim();
    if (
      (trim.startsWith('{') && trim.endsWith('}')) ||
      (trim.startsWith('[') && trim.endsWith(']'))
    ) {
      try {
        return JSON.parse(value);
      } catch (e) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: (e as Error).message,
        });
      }
    }
  }

  return value;
};

const requiredrefine = (x: any, type: string) =>
  x.superRefine((data, ctx) => {
    if (data == null || data == 'undefined') {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: type,
        received: data,
        message: 'required',
      });
    }
  });

const safeDate = z.coerce.date().transform((str, ctx) => {
  const date = new Date(str);
  if (!z.date().safeParse(date).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_date,
    });
  }
  return date;
});

const safeString = (schema: z.ZodTypeAny) =>
  z.preprocess((val, ctx) => {
    if (typeof val === 'string') return val;
    if (
      typeof val === 'number' ||
      typeof val === 'boolean' ||
      val instanceof Date
    )
      return String(val);

    if (val != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: typeof val,
        message: `Expected string, received ${typeof val}`,
      });
    }

    return val;
  }, schema);

const anyTypeEnum = (
  values: OpenApiProp['enum'],
  type: OpenApiProp['type'],
) => {
  if (type != 'number') {
    return z.enum(values as [string, ...string[]]);
  }
  return z.preprocess(
    (val) => {
      if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
        const num = Number(val);
        if (values.includes(num as any)) return num;
      }
      return val;
    },
    z.union(values.map((v) => z.literal(v)) as any),
  );
};
