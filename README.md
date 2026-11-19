# awwards-skill

Skill para Claude que cria sites nível Awwwards e modelos 3D profissionais, sem Blender (a menos que você peça).

Fica por cima de `incridible-skill` e `incridible-skill-3d` e adiciona:

- **Taste**: direção de arte, frase-ideia e um gate contra o "visual de template".
- **Scroll craft**: storytelling guiado por scroll (beats, pins, sequências de quadros, câmera 3D).
- **Graft**: portar recursos de repositórios públicos do GitHub, passando por um gate de licença.
- **Graphify**: mapear um site ou repositório antes de mexer (`scripts/codegraph.mjs`, offline).
- **5 design systems**: Apple, Google Material 3, Microsoft Fluent 2, Atlassian e Salesforce, com um seletor (`scripts/pick-design-system.mjs`) e tokens `--ds-*` verificados em contraste WCAG.
- **Atelier (3D em código)**: modelagem por SDF, texturas PBR, LODs, silhueta para malha e exportação `.glb`, só com Node.

## Instalação

Copie esta pasta para o diretório de skills do Claude (por exemplo `~/.claude/skills/awwards-skill/`), ou empacote com o `package_skill` do skill-creator.

## Verificação

```bash
node scripts/atelier/selftest.mjs
node scripts/contrast-check.mjs assets/design-systems/*/tokens.css
node scripts/pick-design-system.mjs --type marketing --audience consumer --tone premium-minimal --3d yes
```

## Limites

- O Atelier não iguala um gerador aprendido (como o Tripo) em formas orgânicas arbitrárias; para isso há o caminho com gerador em `references/07-3d-generators.md`.
- Os valores dos tokens são aproximações auditadas dos sistemas públicos, não cópias oficiais. Confira na documentação de cada fabricante.
- Os resultados de WebGL/GSAP não foram testados em navegador no ambiente de criação.
