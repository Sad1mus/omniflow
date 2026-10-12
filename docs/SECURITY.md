# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported Until |
|---------|-----------------|
| 1.0.x   | 2027-10-11      |
| < 1.0   | ❌ no supported |

## Reporting a Vulnerability

To report a security vulnerability, please email:

**security@omniflow.dev**

Include:
- Steps to reproduce
- Expected vs actual behavior
- Affected components
- Possible impact

We aim to acknowledge receipt within 24 hours and provide an initial assessment within 48 hours.

## Scope

This policy covers:
- OmniFlow CRM source code
- Docker images
- Configuration files
- Documentation

## Security Practices

### Authentication & Authorization

- All Meta credentials encrypted at rest (AES-256-GCM)
- Service tokens never logged
- Multi-tenant isolation via Row-Level Security (RLS)
- Owner command verification via phone token

### Data Protection

- WhatsApp tokens encrypted with tenant-specific keys
- PII automatically redacted from logs
- Minimum data retention: messages 90 días, audit logs 2 años
- Right to be forgotten: endpoint `/admin/delete-tenant/{id}`

### Network Security

- Webhooks require signature verification
- Rate limiting on all public endpoints
- CORS restricted to approved domains
- HTTPS required for production (Meta requirement)

### Dependency Security

- Weekly dependency updates via Dependabot
- Vulnerability scanning with npm audit
- SBOM generated for all releases

### Incident Response

- Security incidents treated as P0/P1
- Forensic logs retained 180 días
- Automatic key rotation on suspected breach
- Transparent disclosure post-incident

## Best Practices for Implementers

1. **Nunca usar Baileys en producción** - riesgo alto de baneo
2. **Rotar claves cada 90 días** - variable `ENCRYPTION_KEY`
3. **Monitorear logs** - buscar patrones inusuales
4. **Actualizar dependencias** - `npm update` semanalmente
5. **Probar en staging** - antes de deploy a prod

## Compliance

- GDPR-ready con derecho al olvido
- SOC 2 Type II en proceso (2027)
- ISO 27001 certificable