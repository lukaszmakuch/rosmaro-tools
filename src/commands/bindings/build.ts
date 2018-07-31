import {Command} from '@oclif/command'
import * as escodegen from 'escodegen'
import * as fs from 'fs'
import * as glob from 'glob'
import * as path from 'path'

const generateASTData = nodes => nodes
  .map((obj, index) => ({...obj, importName: 'handler' + index}))
  .reduce(
    (built, {node, path, importName}) => ({
      imports: [
        ...built.imports,
        {
          name: importName,
          path
        }
      ],
      rows: [
        ...built.rows,
        {
          node,
          importName
        }
      ]
    }),
    {imports: [], rows: []}
  );

// like: import name from 'path';
const generateImportAST = ({name, path}) => ({
  "type": "ImportDeclaration",
  "specifiers": [
      {
          "type": "ImportDefaultSpecifier",
          "local": {"type": "Identifier", "name": name}
      }
  ],
  "source": {"type": "Literal", "value": path}
});

// like: nodeName: importName(opts)
const generateNodeRowAST = ({node, importName}) => ({
  "type": "Property",
  "key": {
      "type": "Literal",
      "value": node,
  },
  "computed": false,
  "value": {
      "type": "CallExpression",
      "callee": {
          "type": "Identifier",
          "name": importName
      },
      "arguments": [
          {
              "type": "Identifier",
              "name": "opts"
          }
      ]
  },
  "kind": "init",
  "method": false,
  "shorthand": false
});

const generateBindingsAST = ({imports, rows}) => ({
    "type": "Program",
    "body": [
        ...imports.map(generateImportAST),
        {
            "type": "ExportDefaultDeclaration",
            "declaration": {
                "type": "ArrowFunctionExpression",
                "id": null,
                "params": [
                    {
                        "type": "Identifier",
                        "name": "opts"
                    }
                ],
                "body": {
                    "type": "ObjectExpression",
                    "properties": rows.map(generateNodeRowAST)
                },
                "generator": false,
                "expression": true,
                "async": false
            }
        }
    ],
    "sourceType": "module"
});

const generateBindingsCode = AST => escodegen.generate(AST);

export default class Build extends Command {
  static description = 'Build a single file exporting the bindings object for Rosmaro based on a directory structure.'

  static examples = [
    `$ rosmaro-cli bindings:build ./my-rosmaro-app/src/bindings
Generated ./my-rosmaro-app/src/bindings/index.js!
`,
  ]

  static flags = {
  }

  static args = [
    {
      name: 'srcDir',
      required: true,
      description: 'The directory containing a directory named "main" which contains an index.js file which is the handler of the "main" node. The consolidated index.js file is going to be generated in under this directory.',
      hidden: false,
    }
  ]

  async run() {
    const {args: {srcDir}, flags} = this.parse(Build)

    const files = glob.sync(
      path.resolve(srcDir, 'main', "**/index.js")
    );

    const getRelativePath = filePath => path.relative(srcDir, filePath);

    const makeNodeName = filePath =>
      path.dirname(getRelativePath(filePath))
      .replace(/\//g, ':');

    const nodes = files.map(filePath => ({
      node: makeNodeName(filePath),
      path: "./" + getRelativePath(filePath)
    }));

    const AST = generateBindingsAST(generateASTData(nodes));

    const bindingsFileContent = generateBindingsCode(AST);

    const outputFile = path.resolve(srcDir, 'index.js');
    fs.writeFileSync(
      outputFile,
      bindingsFileContent,
      {encoding: 'utf8'}
    );

    this.log(`Generated ${path.relative(process.cwd(), outputFile)}!`);
  }
}
