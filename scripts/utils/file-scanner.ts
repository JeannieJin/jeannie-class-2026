import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

/**
 * 파일 스캐너 유틸리티
 * 프로젝트 파일들을 재귀적으로 스캔
 */

export interface ScanOptions {
  extensions?: string[]
  exclude?: string[]
  includeHidden?: boolean
}

export interface ScannedFile {
  path: string
  content: string
  lines: string[]
}

const DEFAULT_EXCLUDE = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.nyc_output',
]

/**
 * 디렉토리를 재귀적으로 스캔하여 파일 목록 반환
 */
export async function scanDirectory(
  dir: string,
  options: ScanOptions = {}
): Promise<string[]> {
  const {
    extensions = ['.ts', '.tsx', '.js', '.jsx', '.env', '.env.local', '.env.production'],
    exclude = DEFAULT_EXCLUDE,
    includeHidden = false,
  } = options

  const files: string[] = []

  async function scan(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      const relativePath = fullPath.replace(dir + '/', '')

      // 제외 디렉토리 확인
      if (exclude.some((pattern) => relativePath.includes(pattern))) {
        continue
      }

      // 숨김 파일 확인
      if (!includeHidden && entry.name.startsWith('.') && entry.name !== '.env' && !entry.name.startsWith('.env.')) {
        continue
      }

      if (entry.isDirectory()) {
        await scan(fullPath)
      } else if (entry.isFile()) {
        // 확장자 확인
        const hasExtension = extensions.some((ext) => entry.name.endsWith(ext))
        if (hasExtension || entry.name === '.env' || entry.name.startsWith('.env.')) {
          files.push(fullPath)
        }
      }
    }
  }

  await scan(dir)
  return files
}

/**
 * 파일을 읽어서 ScannedFile 객체 반환
 */
export async function readFileContent(filePath: string): Promise<ScannedFile> {
  const content = await readFile(filePath, 'utf-8')
  const lines = content.split('\n')

  return {
    path: filePath,
    content,
    lines,
  }
}

/**
 * 여러 파일을 동시에 읽기
 */
export async function readFiles(filePaths: string[]): Promise<ScannedFile[]> {
  return Promise.all(filePaths.map(readFileContent))
}

/**
 * 파일 크기 확인 (바이트)
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath)
  return stats.size
}
