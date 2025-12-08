/* eslint-disable */
export default async () => {
  const t = {
    ['./modules/app/app.dto']: await import('./modules/app/app.dto'),
    ['./modules/users/users.dto']: await import('./modules/users/users.dto'),
  };
  return {
    '@nestjs/swagger': {
      models: [
        [
          import('./modules/app/app.dto'),
          {
            Query1: {
              str1: { required: true, type: () => String },
              str2: { required: false, type: () => String },
              date: { required: true, type: () => Date },
              nbr1: { required: true, type: () => Number },
              nbr2: { required: false, type: () => Number },
            },
            Query2: {
              str1: { required: true, type: () => String },
              nbr1: { required: true, type: () => Number },
              enum1: { required: true, type: () => Object },
            },
            Query3: {
              enum1: { required: true, type: () => Object },
              enum2: { required: true, type: () => Object },
            },
            Query4: {
              query1: {
                required: true,
                type: () => t['./modules/app/app.dto'].Query1,
              },
              field2: { required: true, type: () => Object },
            },
            Query5: {
              query4: {
                required: true,
                type: () => t['./modules/app/app.dto'].Query4,
              },
              force: { required: true, type: () => Boolean },
              query1: {
                required: false,
                type: () => t['./modules/app/app.dto'].Query1,
              },
            },
            Query6: {
              arr: {
                required: true,
                type: () => [t['./modules/app/app.dto'].Query4],
              },
            },
            Query7: {
              str: { required: true, type: () => String },
              nbr: { required: true, type: () => Number },
              email: { required: true, type: () => String },
              url: { required: true, type: () => String },
              phone: { required: true, type: () => String },
            },
            Query8: {
              nested: {
                required: true,
                type: () => ({
                  long: {
                    required: true,
                    type: () => ({
                      prop: { required: true, type: () => Number },
                    }),
                  },
                }),
              },
            },
            Query9: {
              required: {
                required: true,
                type: () => ({
                  long: {
                    required: true,
                    type: () => ({
                      prop: { required: true, type: () => Number },
                    }),
                  },
                  opt: {
                    required: false,
                    type: () => ({
                      prop: { required: true, type: () => Number },
                    }),
                  },
                  semi: {
                    required: false,
                    type: () => ({
                      opt: { required: false, type: () => Number },
                    }),
                  },
                }),
              },
              opt: {
                required: false,
                type: () => ({
                  long: {
                    required: true,
                    type: () => ({
                      prop: { required: true, type: () => Number },
                    }),
                  },
                  opt: {
                    required: false,
                    type: () => ({
                      prop: { required: true, type: () => Number },
                    }),
                  },
                  semi: {
                    required: false,
                    type: () => ({
                      opt: { required: false, type: () => Number },
                    }),
                  },
                }),
              },
            },
            Query10: {
              arr2d: { required: true, type: () => [[String]] },
              arr2d2: { required: false, type: () => [[Number]] },
            },
          },
        ],
        [
          import('./modules/users/users.dto'),
          {
            UserQuery1: {
              name: { required: true, type: () => String },
              age: { required: false, type: () => Number },
            },
            UserQuery2Options: { all: { required: true, type: () => String } },
            UserQuery2: {
              name: { required: true, type: () => String },
              options: {
                required: false,
                type: () => t['./modules/users/users.dto'].UserQuery2Options,
              },
            },
            UserQuery3: {
              a: { required: true, type: () => String },
              b: { required: false, type: () => Number },
            },
            UserQuery4: { required: { required: true, type: () => String } },
            UserQuery6: { force: { required: false, type: () => Boolean } },
            UserQuery7: {
              name: { required: true, type: () => String },
              info: {
                required: true,
                type: () => t['./modules/users/users.dto'].UserQuery7Info,
              },
            },
            UserQuery7Info: { age: { required: true, type: () => Number } },
            UserQuery8Info: {
              name: { required: false, type: () => String, nullable: true },
            },
            UserQuery8: {
              info: {
                required: true,
                type: () => t['./modules/users/users.dto'].UserQuery8Info,
              },
            },
            UserQuery9: {
              name: { required: true, type: () => String },
              status: { required: false, type: () => Object },
              type: { required: true, type: () => Object },
            },
            UserQuery10Part: {
              name: { required: true, type: () => String },
              age: { required: false, type: () => Number },
              type: { required: true, type: () => Object },
              books: { required: false, type: () => [String] },
            },
            UserQuery10: { pet: { required: true, type: () => String } },
          },
        ],
      ],
      controllers: [
        [
          import('./modules/app/app.controller'),
          {
            AppController: {
              getStatus: {},
              getStatusV2: { type: String },
              getQuery1: { type: t['./modules/app/app.dto'].Query1 },
              getQuery2: { type: t['./modules/app/app.dto'].Query2 },
              getQuery3: { type: t['./modules/app/app.dto'].Query3 },
              getQuery4: { type: t['./modules/app/app.dto'].Query4 },
              getQuery5: { type: t['./modules/app/app.dto'].Query5 },
              getQuery6: { type: t['./modules/app/app.dto'].Query6 },
              getQuery7: { type: t['./modules/app/app.dto'].Query7 },
              getQuery8: { type: t['./modules/app/app.dto'].Query8 },
              getQuery9: { type: t['./modules/app/app.dto'].Query9 },
              getQuery10: { type: t['./modules/app/app.dto'].Query10 },
              getResponse1: { type: t['./modules/app/app.dto'].Query1 },
              getResponse2: { type: t['./modules/app/app.dto'].Query2 },
              getResponse3: { type: t['./modules/app/app.dto'].Query3 },
              getResponse4: { type: t['./modules/app/app.dto'].Query4 },
              getResponse5: { type: t['./modules/app/app.dto'].Query5 },
              getResponse6: { type: t['./modules/app/app.dto'].Query6 },
              getResponse7: { type: t['./modules/app/app.dto'].Query7 },
              getResponse8: { type: t['./modules/app/app.dto'].Query8 },
              getResponse9: { type: t['./modules/app/app.dto'].Query9 },
              getResponse10: { type: t['./modules/app/app.dto'].Query10 },
            },
          },
        ],
        [
          import('./modules/users/users.controller'),
          {
            UsersController: {
              getQuery1: { type: t['./modules/users/users.dto'].UserQuery1 },
              getResponse1: { type: t['./modules/users/users.dto'].UserQuery1 },
              getQuery2: { type: t['./modules/users/users.dto'].UserQuery2 },
              getResponse2: { type: t['./modules/users/users.dto'].UserQuery2 },
              getQuery3: { type: String },
              getQuery4: { type: String },
              getQuery5: {},
              getQuery6: { type: t['./modules/users/users.dto'].UserQuery6 },
              getQuery7: { type: t['./modules/users/users.dto'].UserQuery7 },
              getQuery8: { type: t['./modules/users/users.dto'].UserQuery8 },
              getQuery9: { type: t['./modules/users/users.dto'].UserQuery9 },
              getQuery10: { type: t['./modules/users/users.dto'].UserQuery10 },
            },
          },
        ],
      ],
    },
  };
};
