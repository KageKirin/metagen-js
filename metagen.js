#!/usr/bin/env node

'use strict';

const fs = require('fs');
const glob = require("glob");
const { ArgumentParser } = require('argparse');
const { XXHash64, XXHash128 } = require('xxhash-addon');
const { version } = require('./package.json');

const parser = new ArgumentParser({
  description: 'Unity .meta file generator',
  add_help: true,
});

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-s', '--seed', { help: 'seed string, e.g. package name', type: String, default: process.cwd() })
parser.add_argument('-o', '--overwrite', { help: 'overwrite existing .meta files', action: 'store_true' })
parser.add_argument('files', { help: 'files to generate .meta files for', nargs: '+'})

const args = parser.parse_args();
main();

function main()
{
    console.dir(args);
    let xxh64 = new XXHash64();
    xxh64.update(Buffer.from(args.seed));
    const seed = xxh64.digest();
    console.dir({seed: args.seed, hash: seed.toString('hex')});

    let xxh128 = new XXHash128(seed);

    args.files.forEach(_file => {
        glob(_file, (er, files) => {
            files.forEach(file => {
                if (fs.existsSync(file) && !file.endsWith(".meta"))
                {
                    xxh128.update(Buffer.from(file));
                    let guid = xxh128.digest();
                    xxh128.reset();

                    generateMetaFile(file, guid, args.overwrite);
                }
            })
        })
    });
}

function generateMetaFile(file, guid, overwrite)
{
    let metatemplate = `fileFormatVersion: 2
guid: ${guid.toString('hex')}
MonoImporter:
  externalObjects: {}
  serializedVersion: 2
  defaultReferences: []
  executionOrder: 0
  icon: {instanceID: 0}
  userData: 
  assetBundleName: 
  assetBundleVariant:
`;

    console.dir({file, guid: guid.toString('hex') });
    let metafile = file + ".meta";

    if (fs.existsSync(metafile) && !overwrite) {
      console.log(`skipping ${metafile}`);
      return;
    }

    console.log(`writing ${metafile}`);
    console.log(metatemplate);
    fs.writeFile(metafile, metatemplate, err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
}
