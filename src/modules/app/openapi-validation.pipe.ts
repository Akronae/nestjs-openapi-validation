import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { mapEntries } from 'radash';
import { z, ZodType } from 'zod';

type OpenApiProp = {
  type?: string;
  enum?: [string, ...string[]];
  oneOf?: [OpenApiProp, OpenApiProp, ...OpenApiProp[]];
  $ref?: string;
};

@Injectable()
export class MetadataValidationPipe implements PipeTransform {
  private schemaMap: Record<
    string,
    Record<
      string,
      {
        type: () => { name: string };
        required: boolean;
      }
    >
  > = {};

  constructor(
    tsMetadata: () => Promise<{
      '@nestjs/swagger': {
        models: (
          | Promise<any>
          | Record<
              string,
              Record<
                string,
                { type: () => { name: string }; required: boolean }
              >
            >
        )[][];
      };
    }>,
    private readonly openapi: OpenAPIObject,
  ) {
    tsMetadata().then((res) => {
      const models = res['@nestjs/swagger'].models[0];
      for (const classes of Object.values(models)) {
        for (const [className, fields] of Object.entries(classes)) {
          this.schemaMap[className] = fields as (typeof this.schemaMap)[string];
        }
      }
    });
  }

  transform(value: any, metadata: ArgumentMetadata) {
    const dtoName = metadata.metatype?.name;
    if (!dtoName || !this.schemaMap[dtoName]) return value;

    const zodSchema = this.getZodSchema(dtoName);

    const res = zodSchema.safeParse(value);

    if (!res.success) {
      throw new BadRequestException(res.error);
    }

    return res.data;
  }

  getZodSchema(dtoName: string) {
    const tsschema = this.schemaMap[dtoName];
    const openapischema = this.openapi.components?.schemas[dtoName];
    // z.object({ a: z.coerce.().describe });

    const zodSchema = z.object({
      ...mapEntries(tsschema, (k, v) => {
        const prop = (openapischema as any).properties[k];
        const val = this.openapiPropToZod(prop, v);

        if (!val) {
          console.error(prop);
          throw new Error(`Unknown type: ${prop.type} for key ${k}`);
        }

        return [k, val];
      }),
    });

    return zodSchema;
  }

  openapiPropToZod(prop: OpenApiProp, opts: { required: boolean }): ZodType {
    if (prop.oneOf?.length > 1) {
      return z.union(
        prop.oneOf.map((o) => this.openapiPropToZod(o, { required: true })) as [
          ZodType,
          ZodType,
          ...ZodType[],
        ],
      );
    }

    if (prop.$ref) {
      const dtoname = prop.$ref.split('/').pop();
      return this.getZodSchema(dtoname);
    }

    const type = prop.type;

    let val = prop.enum
      ? z.enum(prop.enum)
      : type in z.coerce
        ? z.coerce[type]()
        : null;

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
    if (data == null || data == '' || data == 'undefined') {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: type,
        received: data,
        message: 'required',
      });
    }
  });
