# C.I.M — Sistema de Gestão de Professores

## Como colocar online (Vercel) — passo a passo

### 1. Criar conta no GitHub (grátis)
1. Vai a https://github.com e clica em "Sign up"
2. Cria uma conta com o teu email

### 2. Criar repositório
1. Depois de entrar no GitHub, clica no "+" no canto superior direito
2. Clica em "New repository"
3. Nome: `cim-gestao`
4. Clica em "Create repository"

### 3. Fazer upload dos ficheiros
1. Na página do repositório, clica em "uploading an existing file"
2. Arrasta TODA a pasta `cim-app` para lá
3. Clica em "Commit changes"

### 4. Criar conta no Vercel (grátis)
1. Vai a https://vercel.com
2. Clica em "Sign up"
3. Escolhe "Continue with GitHub" — liga as duas contas

### 5. Publicar a app
1. No Vercel, clica em "Add New Project"
2. Seleciona o repositório `cim-gestao`
3. Clica em "Deploy"
4. Aguarda 1-2 minutos

### 6. A app fica online!
O Vercel dá-te um link como: `cim-gestao.vercel.app`
Partilha esse link com os professores — funciona em qualquer telemóvel ou computador.

---

## Configuração inicial (depois de colocar online)

1. Abre o link da app
2. Faz login com: **coord** / **admin123**
3. Vai a **Definições** e coloca a tua Chave API Anthropic
   - Obtém a chave em: https://console.anthropic.com
4. Vai a **Professores** e cria as fichas dos professores
5. Vai a **Alunos** e adiciona os alunos, alocando cada um ao professor certo
6. Partilha o link + credenciais com cada professor

---

## Credenciais padrão
- Coordenador: `coord` / `admin123`
- Professores: criados pelo coordenador (ex: `prof01` / senha definida)

## Notas
- Todos os dados são guardados no browser de cada utilizador (localStorage)
- Para partilhar dados entre dispositivos, será necessário uma base de dados — podemos configurar isso numa próxima fase
