import { BadRequestException, Paramtype } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { mapEntries } from 'radash';
import z, { ZodSchema, ZodType } from 'zod';
import { getIgnoredOpenApiModels } from './openapi-ignore.decorator';

type OpenApiProp = {
  type?: string;
  enum?: [string, ...string[]];
  oneOf?: [OpenApiProp, OpenApiProp, ...OpenApiProp[]];
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
      ...mapEntries(tsschema, (k, v) => {
        const prop = openapischema.properties[k] as OpenApiProp;
        const val = this.openapiPropToZod(prop, v);

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

    if (prop.oneOf?.length > 1) {
      return z.union(
        prop.oneOf.map((o) => this.openapiPropToZod(o, { required: true })) as [
          ZodType,
          ZodType,
          ...ZodType[],
        ],
      );
    }

    let val: ZodType;
    let type: string;

    if (prop.$ref) {
      const dtoname = prop.$ref.split('/').pop();
      val = this.getZodSchema(dtoname);
      type = dtoname;
    } else {
      type = prop.type;
      val = prop.enum
        ? z.enum(prop.enum)
        : type in z.coerce
          ? z.coerce[type]()
          : type == 'array'
            ? z.array(this.openapiPropToZod(prop.items, opts))
            : null;

      if (type == 'boolean') {
        val = z.preprocess(
          (val) => String(val).toLowerCase() === 'true',
          z.boolean(),
        );
      }

      if (type == 'object') {
        val = z.object(
          mapEntries(prop.properties, (k, v) => [
            k,
            this.openapiPropToZod(v, opts.type?.()[k]),
          ]),
        );
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
    if (opts.required === false) val = val.optional();
    else val = requiredrefine(val, type);

    if (opts.nullable || prop.nullable) {
      val = z.null().or(val);
    }

    return val as ZodType;
  }
}

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
