import { BadRequestException, Paramtype } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { mapEntries } from 'radash';
import z, { ZodSchema, ZodType } from 'zod';

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
};

type DeepArray<T> = T | DeepArray<T>[];

type PropType<T = { name: string }> = {
  type: () => DeepArray<T> | Record<string | number, PropType<T>>;
  required: boolean;
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
    const tsschema = this.schemata[dtoName];
    const openapischema = this.openapi.components?.schemas[
      dtoName
    ] as SchemaObject;

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

      if (type == 'object') {
        val = z.object(
          mapEntries(prop.properties, (k, v) => [
            k,
            this.openapiPropToZod(v, opts.type?.()[k]),
          ]),
        );
      }

      if (prop.format) {
        let format = prop.format;
        if (format == 'date-time') format = 'datetime';

        if (val[format]) {
          val = val[format]();
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

    if (!val) {
      return null;
    }
    if (opts.required === false) val = val.optional();
    else val = requiredrefine(val, type);

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
