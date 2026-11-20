import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

// tsc only emits JavaScript. The stylesheet is a published artifact, so copy
// it into dist where the package's exports map points.
const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const target = join(root, "dist", "styles.css")

mkdirSync(dirname(target), { recursive: true })
copyFileSync(join(root, "src", "styles.css"), target)

console.log(`copied styles.css -> ${target}`)
