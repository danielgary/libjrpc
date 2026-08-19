import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'libjrpc-package-'))

try {
	const packOutput = execFileSync(
		npmCommand,
		['pack', '--json', '--silent', '--pack-destination', temporaryDirectory],
		{
			cwd: repositoryRoot,
			encoding: 'utf8'
		}
	)
	const [packResult] = JSON.parse(packOutput)
	const packedFiles = packResult.files.map(({ path }) => path)

	for (const requiredFile of [
		'LICENSE',
		'MIGRATING.md',
		'README.md',
		'dist/index.d.ts',
		'dist/index.js',
		'package.json'
	]) {
		assert.ok(packedFiles.includes(requiredFile), `Packed package is missing ${requiredFile}`)
	}

	const unexpectedFiles = packedFiles.filter(
		(path) => !['LICENSE', 'MIGRATING.md', 'README.md', 'package.json'].includes(path) && !path.startsWith('dist/')
	)
	assert.deepEqual(unexpectedFiles, [], `Packed package has unexpected files: ${unexpectedFiles.join(', ')}`)
	assert.ok(
		packedFiles.every((path) => !/\.(?:spec|test)\.[cm]?[jt]sx?$/.test(path)),
		'Packed package contains test files'
	)

	const packageMetadata = JSON.parse(await readFile(join(repositoryRoot, 'package.json'), { encoding: 'utf8' }))
	const tarballPath = join(temporaryDirectory, packResult.filename)

	await writeFile(
		join(temporaryDirectory, 'package.json'),
		JSON.stringify({ name: 'libjrpc-package-verification', private: true })
	)
	execFileSync(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], {
		cwd: temporaryDirectory,
		stdio: 'inherit'
	})

	await writeFile(
		join(temporaryDirectory, 'runtime-smoke.cjs'),
		`const assert = require('node:assert/strict')
const { createJRPCServer, JRPCErrorCodes, jsonSerializer } = require('libjrpc')

const server = createJRPCServer({ sum: (params) => params[0] + params[1] })
const dateServer = createJRPCServer(
  { now: () => new Date('2026-08-19T12:00:00.000Z') },
  { serializeResult: jsonSerializer }
)

Promise.all([
  server.handleRequest({ jsonrpc: '2.0', id: 1, method: 'sum', params: [2, 3] }),
  dateServer.handleRequest({ jsonrpc: '2.0', id: 2, method: 'now' })
])
  .then(([sumResponse, dateResponse]) => {
    assert.deepEqual(sumResponse, { jsonrpc: '2.0', id: 1, result: 5 })
    assert.deepEqual(dateResponse, {
      jsonrpc: '2.0',
      id: 2,
      result: '2026-08-19T12:00:00.000Z'
    })
    assert.equal(JRPCErrorCodes.METHOD_NOT_FOUND, -32601)
  })
  .catch((error) => {
    process.nextTick(() => {
      throw error
    })
  })
`
	)
	execFileSync(process.execPath, [join(temporaryDirectory, 'runtime-smoke.cjs')], {
		cwd: temporaryDirectory,
		stdio: 'inherit'
	})

	await writeFile(
		join(temporaryDirectory, 'types-smoke.ts'),
		`import {
  createJRPCServer,
  jsonSerializer,
  type JRPCCall,
  type JRPCResultSerializer,
  type JRPCResponseBody
} from 'libjrpc'

const request: JRPCCall = { jsonrpc: '2.0', id: 'smoke', method: 'echo', params: ['hello'] }
const serializer: JRPCResultSerializer = jsonSerializer
const server = createJRPCServer({ echo: (params) => params ?? null }, { serializeResult: serializer })
const response: Promise<JRPCResponseBody> = server.handleRequest(request)

void response
`
	)
	await writeFile(
		join(temporaryDirectory, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				lib: ['ES2022'],
				module: 'Node16',
				moduleResolution: 'Node16',
				noEmit: true,
				strict: true,
				target: 'ES2022'
			},
			files: ['types-smoke.ts']
		})
	)

	const typescriptCompiler = join(repositoryRoot, 'node_modules', 'typescript', 'bin', 'tsc')
	execFileSync(process.execPath, [typescriptCompiler, '--project', join(temporaryDirectory, 'tsconfig.json')], {
		cwd: temporaryDirectory,
		stdio: 'inherit'
	})

	process.stdout.write(
		`Verified ${packageMetadata.name}@${packageMetadata.version}: ${packedFiles.length} files, runtime load, and types.\n`
	)
} finally {
	await rm(temporaryDirectory, { force: true, recursive: true })
}
