# 💎 FinanceHub - Sistema Financeiro Premium

Sistema completo de gestão financeira para e-commerce com integração Nuvemshop, tema dark premium e armazenamento seguro na nuvem.

## 🚀 Funcionalidades

### ✅ Implementado
- ✅ **Dashboard completo** com gráficos interativos
- ✅ **Gestão de Receitas** (CRUD completo + edição)
- ✅ **Gestão de Despesas** (CRUD completo + edição + 3 tipos)
- ✅ **Tráfego Pago** (aba dedicada com períodos de cobrança)
- ✅ **Métricas e KPIs** (ROI, margem, ticket médio, etc)
- ✅ **Relatórios** (backup JSON)
- ✅ **Autenticação Firebase** (login/cadastro seguro)
- ✅ **Banco de dados Firestore** (dados na nuvem)
- ✅ **Input de valores inteligente** (sem vírgula manual)
- ✅ **Tema dark premium** com azul neon
- ✅ **Contraste otimizado** em selects e formulários

### 🔄 Em Desenvolvimento
- ⏳ Integração Nuvemshop (estrutura pronta)
- ⏳ Exportar PDF/Excel
- ⏳ Gráficos de evolução real

---

## 📋 Pré-requisitos

1. **Conta no Firebase** (grátis)
2. **Conta no GitHub** (grátis)
3. **Navegador moderno** (Chrome, Edge, Firefox, Safari)

---

## 🔧 Instalação

### **PASSO 1: Criar Projeto Firebase**

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `financehub` (ou outro nome)
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### **PASSO 2: Configurar Firebase**

1. No Firebase Console, clique em **"Web"** (ícone `</>`)
2. Nome do app: `FinanceHub`
3. **NÃO marque** "Configure Firebase Hosting"
4. Clique em "Registrar app"
5. **COPIE** as configurações que aparecem:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "financehub-xxx.firebaseapp.com",
  projectId: "financehub-xxx",
  storageBucket: "financehub-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### **PASSO 3: Ativar Autenticação**

1. No Firebase Console, vá em **Authentication**
2. Clique em "Começar"
3. Ative **"Email/senha"**
4. Salve

### **PASSO 4: Criar Banco de Dados**

1. No Firebase Console, vá em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha **"Iniciar no modo de produção"**
4. Selecione a região mais próxima (ex: `southamerica-east1`)
5. Clique em "Ativar"

### **PASSO 5: Configurar Regras de Segurança**

1. Ainda no Firestore, clique na aba **"Regras"**
2. **SUBSTITUA** as regras existentes por estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem ler/escrever seus próprios dados
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /receitas/{receitaId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
    
    match /despesas/{despesaId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
    
    match /trafego/{trafegoId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Clique em "Publicar"

### **PASSO 6: Configurar o Código**

1. Abra o arquivo `app.js`
2. Localize a seção `firebaseConfig` (linha ~20)
3. **SUBSTITUA** com as suas configurações do Passo 2:

```javascript
const firebaseConfig = {
    apiKey: "COLE_SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};
```

### **PASSO 7: Subir para o GitHub**

1. Crie um repositório no GitHub chamado `financehub`
2. **Marque como PÚBLICO** (GitHub Pages precisa de repo público no plano grátis)
3. No terminal/prompt de comando:

```bash
cd financehub
git init
git add .
git commit -m "Initial commit - FinanceHub"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/financehub.git
git push -u origin main
```

### **PASSO 8: Ativar GitHub Pages**

1. No repositório do GitHub, vá em **Settings** → **Pages**
2. Em "Source", selecione: **main** branch
3. Pasta: **/ (root)**
4. Clique em **Save**
5. Aguarde 1-2 minutos
6. Acesse: `https://SEU_USUARIO.github.io/financehub`

---

## 🔒 Segurança

### ✅ O QUE ESTÁ PROTEGIDO:

1. **Firestore Rules** - Cada usuário só vê seus próprios dados
2. **Autenticação obrigatória** - Sem login = sem acesso
3. **Credenciais no .gitignore** - Nunca vão pro GitHub
4. **HTTPS automático** - GitHub Pages tem SSL grátis

### ⚠️ IMPORTANTE:

- ❌ **NUNCA** commite arquivos `.env` ou com credenciais
- ❌ **NUNCA** compartilhe seu `firebaseConfig` publicamente
- ✅ As configurações Firebase no código **SÃO SEGURAS** porque as regras do Firestore protegem os dados
- ✅ Mesmo que alguém veja seu `apiKey`, não consegue acessar dados de outros usuários

---

## 🛒 Integração Nuvemshop (Próximo Passo)

A estrutura está pronta. Para conectar:

1. Acesse seu painel Nuvemshop
2. Vá em **Configurações** → **API**
3. Gere um **Token de acesso**
4. No FinanceHub, vá em **Nuvemshop** → **Conectar**
5. Cole o token (será criptografado no Firebase)

---

## 📊 Como Usar

### **Primeiro Acesso:**
1. Acesse o site hospedado
2. Clique em "Cadastro"
3. Preencha: nome do negócio, email, senha
4. Faça login

### **Adicionar Receitas:**
1. Clique em "Receitas" na sidebar
2. Botão "+ Nova Receita"
3. Digite o valor (ex: `1500` vira automaticamente `1.500,00`)
4. Preencha origem, data, observação
5. Salvar

### **Adicionar Despesas:**
1. Clique em "Despesas"
2. Botão "+ Nova Despesa"
3. Escolha o tipo: **Fixa**, **Variável** ou **Cobrança Única**
4. Salvar

### **Tráfego Pago:**
1. Clique em "Tráfego Pago"
2. Adicione investimentos por plataforma
3. Escolha período: **Diário**, **Semanal** ou **Mensal**

---

## 🎨 Melhorias Implementadas

✅ **Input de valores**: Digite `1500` → vira `1.500,00`  
✅ **Editar lançamentos**: Clique no lápis ✏️  
✅ **3 tipos de despesa**: Fixa, Variável, Cobrança Única  
✅ **Aba Tráfego dedicada**: Controle de ads por plataforma  
✅ **Contraste em selects**: Opções sempre legíveis  

---

## 📁 Estrutura de Arquivos

```
financehub/
├── index.html          # Interface principal
├── styles.css          # Estilos dark premium
├── app.js              # Lógica + Firebase
├── .gitignore          # Arquivos ignorados
└── README.md           # Este arquivo
```

---

## 🆘 Problemas Comuns

### **Erro: "Firebase not configured"**
→ Verifique se colocou suas credenciais no `app.js`

### **Erro: "Permission denied"**
→ Verifique as regras do Firestore (Passo 5)

### **Site não carrega no GitHub Pages**
→ Aguarde 2-3 minutos após ativar
→ Limpe cache do navegador (Ctrl + Shift + Del)

### **Login não funciona**
→ Ative "Email/senha" no Firebase Authentication

---

## 📞 Suporte

Dúvidas? Abra uma **Issue** no GitHub!

---

## 📜 Licença

MIT License - Use à vontade!

---

**Desenvolvido com 💙 por FinanceHub Team**