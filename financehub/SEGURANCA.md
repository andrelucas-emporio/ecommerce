# 🔒 GUIA DE SEGURANÇA - FinanceHub

## ⚠️ LEIA COM ATENÇÃO ANTES DE FAZER O DEPLOY!

---

## 🛡️ Checklist de Segurança

Antes de subir para o GitHub, verifique:

### ✅ OBRIGATÓRIO:

- [ ] Criei o arquivo `.gitignore` na raiz do projeto
- [ ] Configurei as **Firestore Rules** (modo produção)
- [ ] Testei o login localmente
- [ ] **NÃO** estou commitando arquivos sensíveis
- [ ] Revisei o `app.js` para garantir que não tem tokens da Nuvemshop

---

## 🔐 O que NUNCA deve ir para o GitHub:

```
❌ NUNCA COMMITAR:
├── .env
├── .env.local
├── firebase-config.js (se separado)
├── nuvemshop-credentials.json
├── *.key
├── *.pem
├── backups/ (com dados reais)
└── qualquer arquivo com senhas/tokens
```

---

## ✅ O que PODE ir para o GitHub:

```
✅ SEGURO PARA COMMITAR:
├── index.html
├── styles.css
├── app.js (COM as configs Firebase - veja explicação abaixo)
├── .gitignore
└── README.md
```

---

## 🤔 Por que as configs Firebase podem ser públicas?

### **Resposta curta:** As regras do Firestore protegem os dados.

### **Explicação detalhada:**

1. **apiKey, projectId, etc são identificadores públicos**
   - Não são senhas secretas
   - Servem apenas para conectar ao projeto Firebase
   - São NECESSÁRIOS no frontend

2. **A SEGURANÇA está nas Firestore Rules:**
   ```javascript
   // Esta regra IMPEDE que um usuário veja dados de outro:
   allow read, write: if request.auth.uid == resource.data.userId;
   ```

3. **Mesmo se alguém usar seu apiKey:**
   - Consegue conectar ao Firebase ✓
   - MAS não consegue ler dados de outros usuários ✗
   - Cada usuário só vê seus próprios dados ✓

### **Analogia:**
- `apiKey` = endereço do prédio (público)
- Firestore Rules = chave do apartamento (privado)
- Mesmo sabendo o endereço, ninguém entra sem a chave certa!

---

## 🚨 O que PROTEGE seus dados:

### 1. **Firestore Rules (Firewall)**
```javascript
// REGRA FUNDAMENTAL:
allow read, write: if request.auth.uid == resource.data.userId;

// Tradução:
// "Só deixe ler/escrever se o ID do usuário logado
//  for igual ao ID do dono dos dados"
```

### 2. **Autenticação Obrigatória**
- Sem login → sem acesso a NADA
- Cada usuário tem um ID único (UID)
- Firebase valida automaticamente

### 3. **HTTPS Automático**
- GitHub Pages tem SSL grátis
- Dados trafegam criptografados

---

## 🔒 Nuvemshop - Segurança Extra

### **Token da Nuvemshop NUNCA vai para o código!**

**Fluxo seguro:**
1. Usuário cola o token no formulário da interface
2. Token é salvo **criptografado** no Firestore
3. Token fica associado ao `userId`
4. Só o dono consegue ler seu próprio token

**NO CÓDIGO:**
```javascript
// ❌ ERRADO:
const nuvemshopToken = "seu_token_123";  // NÃO FAÇA ISSO!

// ✅ CERTO:
// Token é salvo no banco:
await setDoc(doc(db, 'usuarios', currentUser.uid), {
    nuvemshopToken: encrypt(token)  // Criptografado + privado
});
```

---

## 📝 Firestore Rules Explicadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // REGRA 1: Dados do usuário
    match /usuarios/{userId} {
      // Só o próprio usuário pode ver/editar seu perfil
      allow read, write: if request.auth.uid == userId;
    }
    
    // REGRA 2: Receitas
    match /receitas/{receitaId} {
      // Leitura/edição: só se for dono dos dados
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      
      // Criação: só se marcar como seu
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
    
    // REGRA 3 e 4: Mesma lógica para despesas e tráfego
    // ...
  }
}
```

### **O que cada parte significa:**

- `request.auth` = usuário que está tentando acessar
- `request.auth.uid` = ID único do usuário logado
- `resource.data.userId` = ID do dono dos dados
- `if ... == ...` = só permite se os IDs baterem

---

## ⚡ Testes de Segurança

### **Teste 1: Criar duas contas**
1. Cadastre usuário A
2. Adicione receitas
3. Faça logout
4. Cadastre usuário B
5. **Resultado esperado:** Usuário B NÃO vê dados do usuário A ✓

### **Teste 2: Inspecionar código**
1. Abra DevTools (F12)
2. Vá em Console
3. Tente acessar dados de outro usuário manualmente
4. **Resultado esperado:** Erro "Permission denied" ✓

---

## 🚫 O que NÃO fazer:

❌ Desabilitar as Firestore Rules  
❌ Usar `allow read, write: if true;` (libera tudo!)  
❌ Commitar arquivos com senhas reais  
❌ Compartilhar o token da Nuvemshop  
❌ Usar a mesma senha em vários lugares  

---

## ✅ Boas Práticas:

✅ Sempre use `.gitignore`  
✅ Teste localmente antes de fazer deploy  
✅ Use senhas fortes (mínimo 8 caracteres)  
✅ Ative autenticação de 2 fatores no Firebase  
✅ Revise as Firestore Rules regularmente  
✅ Faça backup dos dados periodicamente  

---

## 🆘 Em caso de vazamento:

### **Se você commitou credenciais acidentalmente:**

1. **IMEDIATAMENTE:**
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch arquivo-sensível.js" \
   --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

2. **Regenere as credenciais:**
   - Firebase: crie um novo projeto
   - Nuvemshop: gere um novo token

3. **Atualize o código** com as novas credenciais

---

## 📞 Dúvidas sobre Segurança?

- Documentação Firebase Security: https://firebase.google.com/docs/rules
- GitHub Security Best Practices: https://docs.github.com/en/code-security

---

**Lembre-se: Segurança é prioridade! 🔒**

Em caso de dúvida, **NÃO COMMITE** até ter certeza!