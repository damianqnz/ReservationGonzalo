import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim()
  } catch {
    return 'N/A'
  }
}

function getPkgVersion(name) {
  try {
    const pkg = JSON.parse(
      readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')
    )
    return pkg.version
  } catch {
    return 'no instalado'
  }
}

const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Lisbon' })

const content = `# Tech Stack — ReservationGonzalo

> Actualizado automáticamente el **${now}**
> Ejecuta \`npm run tech-stack\` para actualizar.

## Runtime
| Herramienta | Versión |
|-------------|---------|
| Node.js | ${run('node --version')} |
| npm | ${run('npm --version')} |
| Sistema Operativo | ${process.platform} |

## Framework & Lenguaje
| Paquete | Versión |
|---------|---------|
| next | ${getPkgVersion('next')} |
| react | ${getPkgVersion('react')} |
| typescript | ${getPkgVersion('typescript')} |

## Base de datos
| Paquete | Versión |
|---------|---------|
| prisma | ${getPkgVersion('prisma')} |
| @prisma/client | ${getPkgVersion('@prisma/client')} |
| PostgreSQL | 16 (Docker) |

## Autenticación
| Paquete | Versión |
|---------|---------|
| next-auth | ${getPkgVersion('next-auth')} |
| @auth/prisma-adapter | ${getPkgVersion('@auth/prisma-adapter')} |
| bcryptjs | ${getPkgVersion('bcryptjs')} |

## UI & Estilos
| Paquete | Versión |
|---------|---------|
| tailwindcss | ${getPkgVersion('tailwindcss')} |
| lucide-react | ${getPkgVersion('lucide-react')} |
| class-variance-authority | ${getPkgVersion('class-variance-authority')} |
| clsx | ${getPkgVersion('clsx')} |

## Validación & Formularios
| Paquete | Versión |
|---------|---------|
| zod | ${getPkgVersion('zod')} |
| react-hook-form | ${getPkgVersion('react-hook-form')} |

## Dev Tools
| Herramienta | Versión |
|-------------|---------|
| eslint | ${getPkgVersion('eslint')} |
| husky | ${getPkgVersion('husky')} |
| jest | ${getPkgVersion('jest')} |
| prettier | ${getPkgVersion('prettier')} |

## Deploy & CI/CD
| Herramienta | Versión |
|-------------|---------|
| Vercel | latest |
| GitHub Actions | latest |
| Docker | ${run('docker --version').replace('Docker version ', '')} |
`

writeFileSync(join(root, 'TECH_STACK.md'), content)
console.log('✅ TECH_STACK.md actualizado correctamente')
