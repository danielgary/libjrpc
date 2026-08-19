import { readFile } from 'node:fs/promises'

const packageMetadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), { encoding: 'utf8' }))
const releaseTag = process.argv[2] ?? process.env.GITHUB_REF_NAME

if (!releaseTag) {
	throw new Error('A release tag is required')
}

const taggedVersion = releaseTag.startsWith('v') ? releaseTag.slice(1) : releaseTag

if (taggedVersion !== packageMetadata.version) {
	throw new Error(`Release tag ${releaseTag} does not match package version ${packageMetadata.version}`)
}
