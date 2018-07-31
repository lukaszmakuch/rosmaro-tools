import {expect, test} from '@oclif/test'
import * as path from 'path'

describe('bindings:build', () => {

  test
  .stdout()
  .command([
    'bindings:build',
    path.resolve(__dirname, './bindings'),
  ])
  .it('build the bindings', async ctx => {
    const factoryParams = {a: 123, b: 'abc'};
    const expectedBindings = {
      'main': {'main got': factoryParams},
      'main:A': {'main:A got': factoryParams},
      'main:B': {'main:B got': factoryParams, 'main:B imported': 'another file'},
      'main:B:A': {'main:B:A got': factoryParams},
      'main:B:B': {'main:B:B got': factoryParams},
    };
    const builtModulePath = path.resolve(__dirname, 'bindings')
    const generatedFactory = await import(builtModulePath);
    const built = generatedFactory.default(factoryParams);
    expect(built).to.deep.equal(expectedBindings);
  })

})
