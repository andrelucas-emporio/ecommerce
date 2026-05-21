// ============================================
// FINANCEHUB - Sistema Financeiro Premium
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    query, 
    where,
    setDoc,
    getDoc,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// FIREBASE CONFIG
// ============================================
// IMPORTANTE: Estas configurações devem vir de um arquivo .env
// Para uso local temporário, você pode usar estas configs
// NUNCA commite estas configs para o GitHub!

const firebaseConfig = {
    apiKey: "AIzaSyDxxx...",  // ← SUA API KEY REAL
    authDomain: "financehub-andre.firebaseapp.com",
    projectId: "financehub-andre",
    storageBucket: "financehub-andre.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// ESTADO GLOBAL
// ============================================

let currentUser = null;
let receitas = [];
let despesas = [];
let trafego = [];
let charts = {};

// ============================================
// AUTENTICAÇÃO
// ============================================

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        showApp();
        loadUserData();
    } else {
        currentUser = null;
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUserInfo();
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.displayName || 'Usuário';
        document.getElementById('userEmail').textContent = currentUser.email;
    }
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
});

// Cadastro
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const businessName = formData.get('businessName');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Salvar nome do negócio
        await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
            businessName: businessName,
            email: email,
            createdAt: new Date().toISOString()
        });

        alert('Conta criada com sucesso!');
    } catch (error) {
        alert('Erro ao criar conta: ' + error.message);
    }
});

// Logout
window.logout = async function() {
    if (confirm('Deseja realmente sair?')) {
        try {
            await signOut(auth);
        } catch (error) {
            alert('Erro ao sair: ' + error.message);
        }
    }
};

// Tabs de Login/Cadastro
window.showLoginTab = function(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabs[0].classList.add('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabs[1].classList.add('active');
    }
};

// ============================================
// CARREGAR DADOS DO USUÁRIO
// ============================================

async function loadUserData() {
    if (!currentUser) return;

    try {
        // Carregar receitas
        const receitasSnap = await getDocs(
            query(collection(db, 'receitas'), where('userId', '==', currentUser.uid), orderBy('data', 'desc'))
        );
        receitas = receitasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Carregar despesas
        const despesasSnap = await getDocs(
            query(collection(db, 'despesas'), where('userId', '==', currentUser.uid), orderBy('data', 'desc'))
        );
        despesas = despesasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Carregar tráfego
        const trafegoSnap = await getDocs(
            query(collection(db, 'trafego'), where('userId', '==', currentUser.uid), orderBy('data', 'desc'))
        );
        trafego = trafegoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Renderizar dashboard
        renderDashboard();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById(page).classList.remove('hidden');
        
        // Renderizar página específica
        if (page === 'dashboard') renderDashboard();
        if (page === 'receitas') renderReceitas();
        if (page === 'despesas') renderDespesas();
        if (page === 'trafego') renderTrafego();
        if (page === 'metricas') renderMetricas();
        if (page === 'relatorios') renderRelatorios();
    });
});

// ============================================
// FORMATAÇÃO DE MOEDA
// ============================================

// Formatar input de dinheiro
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('money-input')) {
        let value = e.target.value.replace(/\D/g, '');
        value = (parseInt(value) / 100).toFixed(2);
        value = value.replace('.', ',');
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        e.target.value = value;
    }
});

function parseMoneyInput(value) {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatMoney(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================
// CÁLCULOS
// ============================================

function calcularTotais() {
    const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
    const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
    const totalTrafego = trafego.reduce((acc, t) => acc + t.valor, 0);
    const lucroLiquido = totalReceitas - totalDespesas;
    const roi = totalDespesas > 0 ? ((lucroLiquido / totalDespesas) * 100).toFixed(1) : 0;
    const margemLiquida = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100).toFixed(1) : 0;
    const investimentoTrafego = despesas.filter(d => d.categoria === 'Tráfego Pago').reduce((acc, d) => acc + d.valor, 0) + totalTrafego;
    const freteSubsidiado = despesas.filter(d => d.categoria === 'Frete Subsidiado').reduce((acc, d) => acc + d.valor, 0);
    const taxas = despesas.filter(d => d.categoria === 'Plataforma').reduce((acc, d) => acc + d.valor, 0);

    return { 
        totalReceitas, 
        totalDespesas, 
        lucroLiquido, 
        roi, 
        margemLiquida, 
        investimentoTrafego, 
        freteSubsidiado, 
        taxas,
        totalTrafego
    };
}

// ============================================
// RENDER DASHBOARD
// ============================================

function renderDashboard() {
    const totais = calcularTotais();
    
    // Alertas
    let alertsHTML = '';
    if (totais.investimentoTrafego > totais.totalReceitas * 0.2) {
        alertsHTML += '<div class="alert alert-warning"><span>⚠️</span><span>Tráfego pago está consumindo mais de 20% das receitas!</span></div>';
    }
    if (totais.lucroLiquido < totais.totalReceitas * 0.3) {
        alertsHTML += '<div class="alert alert-danger"><span>!</span><span>Margem líquida abaixo de 30% - revise suas despesas</span></div>';
    }
    if (totais.lucroLiquido > totais.totalReceitas * 0.5) {
        alertsHTML += '<div class="alert alert-success"><span>✓</span><span>Excelente! Margem acima de 50%</span></div>';
    }
    document.getElementById('alertsContainer').innerHTML = alertsHTML;

    // Cards principais
    document.getElementById('mainMetrics').innerHTML = `
        ${createMetricCard('Receita Total', totais.totalReceitas, '💰', '#00BFFF', true, '+15.3%')}
        ${createMetricCard('Despesas Totais', totais.totalDespesas, '💸', '#0099FF', true, '+8.2%')}
        ${createMetricCard('Lucro Líquido', totais.lucroLiquido, '📈', '#00FF88', true, '+22.1%')}
        ${createMetricCard('ROI', totais.roi + '%', '🎯', '#FFB800', true, '+5.4%', '')}
    `;

    // Cards secundários
    document.getElementById('secondaryMetrics').innerHTML = `
        ${createMetricCard('Investimento Tráfego', totais.investimentoTrafego, '📱', '#8B5CF6')}
        ${createMetricCard('Frete Subsidiado', totais.freteSubsidiado, '📦', '#EC4899')}
        ${createMetricCard('Taxas Plataforma', totais.taxas, '🏦', '#F59E0B')}
        ${createMetricCard('Caixa Disponível', totais.lucroLiquido, '💵', '#10B981')}
    `;

    renderCharts();
}

function createMetricCard(title, value, icon, color, hasTrend = false, trendValue = '', prefix = 'R$ ') {
    const formattedValue = typeof value === 'number' ? formatMoney(value) : value;
    const trendHTML = hasTrend ? `<div class="metric-trend trend-up"><span>↗</span><span>${trendValue}</span><span style="color: #6b7280;">vs mês anterior</span></div>` : '';
    
    return `
        <div class="metric-card" style="box-shadow: 0 0 20px ${color}10;">
            <div class="metric-card-header">
                <div>
                    <p class="metric-title">${title}</p>
                    <h3 class="metric-value">${prefix}${formattedValue}</h3>
                </div>
                <div class="metric-icon" style="color: ${color}; filter: drop-shadow(0 0 10px ${color});">
                    ${icon}
                </div>
            </div>
            ${trendHTML}
        </div>
    `;
}

// ============================================
// RENDER RECEITAS
// ============================================

function renderReceitas() {
    const totais = calcularTotais();
    
    document.getElementById('receitasMetrics').innerHTML = `
        ${createMetricCard('Total Receitas', totais.totalReceitas, '💰', '#00BFFF')}
        ${createMetricCard('Quantidade', receitas.length, '📊', '#0099FF', false, '', '')}
        ${createMetricCard('Média/Venda', receitas.length > 0 ? totais.totalReceitas / receitas.length : 0, '📈', '#00FF88')}
    `;

    let tableHTML = '';
    receitas.forEach(r => {
        tableHTML += `
            <tr>
                <td>${new Date(r.data).toLocaleDateString('pt-BR')}</td>
                <td><span class="badge badge-blue">${r.origem}</span></td>
                <td style="font-weight: 700; color: white;">R$ ${formatMoney(r.valor)}</td>
                <td>${r.obs || '-'}</td>
                <td>
                    <button class="btn btn-edit" onclick="editReceita('${r.id}')">✏️</button>
                    <button class="btn btn-danger" onclick="deleteReceita('${r.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('receitasTable').innerHTML = tableHTML || '<tr><td colspan="5" style="text-align: center; color: #6b7280;">Nenhuma receita cadastrada</td></tr>';
}

// ============================================
// RENDER DESPESAS
// ============================================

function renderDespesas() {
    const totais = calcularTotais();
    const despesasFixas = despesas.filter(d => d.tipo === 'Fixa').length;
    const despesasVariaveis = despesas.filter(d => d.tipo === 'Variável').length;
    const despesasUnicas = despesas.filter(d => d.tipo === 'Cobrança Única').length;
    
    document.getElementById('despesasMetrics').innerHTML = `
        ${createMetricCard('Total Despesas', totais.totalDespesas, '💸', '#FF4444')}
        ${createMetricCard('Despesas Fixas', despesasFixas, '📌', '#FF8844', false, '', '')}
        ${createMetricCard('Despesas Variáveis', despesasVariaveis, '📊', '#FFBB44', false, '', '')}
    `;

    let tableHTML = '';
    despesas.forEach(d => {
        const badgeColor = d.tipo === 'Fixa' ? 'badge-purple' : d.tipo === 'Variável' ? 'badge-yellow' : 'badge-green';
        tableHTML += `
            <tr>
                <td>${new Date(d.data).toLocaleDateString('pt-BR')}</td>
                <td><span class="badge badge-red">${d.categoria}</span></td>
                <td><span class="badge ${badgeColor}">${d.tipo}</span></td>
                <td style="font-weight: 700; color: white;">R$ ${formatMoney(d.valor)}</td>
                <td>${d.obs || '-'}</td>
                <td>
                    <button class="btn btn-edit" onclick="editDespesa('${d.id}')">✏️</button>
                    <button class="btn btn-danger" onclick="deleteDespesa('${d.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('despesasTable').innerHTML = tableHTML || '<tr><td colspan="6" style="text-align: center; color: #6b7280;">Nenhuma despesa cadastrada</td></tr>';
}

// Continua no próximo arquivo...

// ============================================
// RENDER TRÁFEGO
// ============================================

function renderTrafego() {
    const totais = calcularTotais();
    const metaAds = trafego.filter(t => t.plataforma === 'Meta Ads').reduce((acc, t) => acc + t.valor, 0);
    const googleAds = trafego.filter(t => t.plataforma === 'Google Ads').reduce((acc, t) => acc + t.valor, 0);
    
    document.getElementById('trafegoMetrics').innerHTML = `
        ${createMetricCard('Total Investido', totais.totalTrafego, '📱', '#8B5CF6')}
        ${createMetricCard('Meta Ads', metaAds, '📘', '#0099FF', false, '', '')}
        ${createMetricCard('Google Ads', googleAds, '🔍', '#FFB800', false, '', '')}
    `;

    let tableHTML = '';
    trafego.forEach(t => {
        const roi = 'Calcular...'; // Implementar cálculo de ROI específico
        tableHTML += `
            <tr>
                <td>${new Date(t.data).toLocaleDateString('pt-BR')}</td>
                <td><span class="badge badge-purple">${t.plataforma}</span></td>
                <td><span class="badge badge-blue">${t.periodo}</span></td>
                <td style="font-weight: 700; color: white;">R$ ${formatMoney(t.valor)}</td>
                <td style="color: #00FF88;">${roi}</td>
                <td>
                    <button class="btn btn-edit" onclick="editTrafego('${t.id}')">✏️</button>
                    <button class="btn btn-danger" onclick="deleteTrafego('${t.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('trafegoTable').innerHTML = tableHTML || '<tr><td colspan="6" style="text-align: center; color: #6b7280;">Nenhum investimento cadastrado</td></tr>';
}

// ============================================
// RENDER MÉTRICAS
// ============================================

function renderMetricas() {
    const totais = calcularTotais();
    const ticketMedio = receitas.length > 0 ? totais.totalReceitas / receitas.length : 0;
    const percentDespesas = totais.totalReceitas > 0 ? ((totais.totalDespesas / totais.totalReceitas) * 100).toFixed(1) : 0;
    
    document.getElementById('kpisMetrics').innerHTML = `
        ${createMetricCard('ROI', totais.roi + '%', '🎯', '#00BFFF', true, '+5.4%', '')}
        ${createMetricCard('Margem Líquida', totais.margemLiquida + '%', '📊', '#00FF88', true, '+3.2%', '')}
        ${createMetricCard('Ticket Médio', ticketMedio, '💳', '#8B5CF6', true, '+8.1%')}
        ${createMetricCard('% Despesas/Receita', percentDespesas + '%', '📉', '#EC4899', false, '', '')}
        ${createMetricCard('Lucro Mensal', totais.lucroLiquido, '💰', '#00FF88', true, '+22.1%')}
        ${createMetricCard('Crescimento', '18.5%', '📈', '#FFB800', true, '+4.7%', '')}
    `;

    // Pontos Fortes
    let pontosFortes = '';
    if (totais.margemLiquida > 30) {
        pontosFortes += '<li><span>✓</span><span>Margem líquida acima de ' + totais.margemLiquida + '%</span></li>';
    }
    if (totais.roi > 0) {
        pontosFortes += '<li><span>✓</span><span>ROI positivo em ' + totais.roi + '%</span></li>';
    }
    pontosFortes += '<li><span>✓</span><span>Crescimento constante de receitas</span></li>';
    document.getElementById('pontosFortes').innerHTML = pontosFortes;

    // Pontos de Atenção
    let pontosAtencao = '';
    if (totais.investimentoTrafego > totais.totalDespesas * 0.5) {
        pontosAtencao += '<li><span>!</span><span>Tráfego representa ' + ((totais.investimentoTrafego/totais.totalDespesas)*100).toFixed(1) + '% das despesas</span></li>';
    }
    pontosAtencao += '<li><span>!</span><span>Frete subsidiado em R$ ' + formatMoney(totais.freteSubsidiado) + '</span></li>';
    pontosAtencao += '<li><span>!</span><span>Considere otimizar custos variáveis</span></li>';
    document.getElementById('pontosAtencao').innerHTML = pontosAtencao;

    // Fluxo de Caixa
    document.getElementById('fluxoCaixa').innerHTML = `
        <div class="flux-card">
            <p>Disponível Agora</p>
            <p style="color: #00FF88;">R$ ${formatMoney(totais.lucroLiquido)}</p>
        </div>
        <div class="flux-card">
            <p>Entradas Futuras</p>
            <p style="color: #00BFFF;">R$ 12.400,00</p>
        </div>
        <div class="flux-card">
            <p>Saídas Futuras</p>
            <p style="color: #FF4444;">R$ 4.200,00</p>
        </div>
        <div class="flux-card">
            <p>Saldo Projetado</p>
            <p style="color: #FFB800;">R$ ${formatMoney(totais.lucroLiquido + 12400 - 4200)}</p>
        </div>
    `;
}

// ============================================
// RENDER RELATÓRIOS
// ============================================

function renderRelatorios() {
    const totais = calcularTotais();
    
    document.getElementById('resumoPeriodo').innerHTML = `
        <div class="flux-card">
            <p>Total Receitas</p>
            <p style="color: #00BFFF;">R$ ${formatMoney(totais.totalReceitas)}</p>
            <small style="color: #6b7280; font-size: 0.75rem;">${receitas.length} transações</small>
        </div>
        <div class="flux-card">
            <p>Total Despesas</p>
            <p style="color: #FF4444;">R$ ${formatMoney(totais.totalDespesas)}</p>
            <small style="color: #6b7280; font-size: 0.75rem;">${despesas.length} lançamentos</small>
        </div>
        <div class="flux-card">
            <p>Lucro Líquido</p>
            <p style="color: #00FF88;">R$ ${formatMoney(totais.lucroLiquido)}</p>
            <small style="color: #6b7280; font-size: 0.75rem;">Margem: ${totais.margemLiquida}%</small>
        </div>
        <div class="flux-card">
            <p>ROI</p>
            <p style="color: #FFB800;">${totais.roi}%</p>
            <small style="color: #6b7280; font-size: 0.75rem;">Return on Investment</small>
        </div>
    `;
}

// ============================================
// GRÁFICOS
// ============================================

function renderCharts() {
    const dadosLinha = [
        { mes: 'Jan', receitas: 18500, despesas: 9200, lucro: 9300 },
        { mes: 'Fev', receitas: 21300, despesas: 10800, lucro: 10500 },
        { mes: 'Mar', receitas: 24600, despesas: 11500, lucro: 13100 },
        { mes: 'Abr', receitas: 27800, despesas: 12300, lucro: 15500 },
        { mes: 'Mai', receitas: 29320, despesas: 13150, lucro: 16170 }
    ];

    const totais = calcularTotais();

    // Destruir gráficos anteriores
    Object.values(charts).forEach(chart => chart.destroy());

    // Line Chart
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    charts.line = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: dadosLinha.map(d => d.mes),
            datasets: [
                {
                    label: 'Receitas',
                    data: dadosLinha.map(d => d.receitas),
                    borderColor: '#00BFFF',
                    backgroundColor: 'rgba(0, 191, 255, 0.1)',
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Despesas',
                    data: dadosLinha.map(d => d.despesas),
                    borderColor: '#FF4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Lucro',
                    data: dadosLinha.map(d => d.lucro),
                    borderColor: '#00FF88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                y: { ticks: { color: '#666' }, grid: { color: '#1a2332' } },
                x: { ticks: { color: '#666' }, grid: { color: '#1a2332' } }
            }
        }
    });

    // Pie Chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    charts.pie = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Tráfego Pago', 'Frete', 'Plataforma', 'Outros'],
            datasets: [{
                data: [
                    totais.investimentoTrafego,
                    totais.freteSubsidiado,
                    totais.taxas,
                    totais.totalDespesas - totais.investimentoTrafego - totais.freteSubsidiado - totais.taxas
                ],
                backgroundColor: ['#00BFFF', '#0099FF', '#0077CC', '#005599']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });

    // Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: dadosLinha.map(d => d.mes),
            datasets: [
                {
                    label: 'Receitas',
                    data: dadosLinha.map(d => d.receitas),
                    backgroundColor: '#00BFFF'
                },
                {
                    label: 'Despesas',
                    data: dadosLinha.map(d => d.despesas),
                    backgroundColor: '#FF4444'
                },
                {
                    label: 'Lucro',
                    data: dadosLinha.map(d => d.lucro),
                    backgroundColor: '#00FF88'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                y: { ticks: { color: '#666' }, grid: { color: '#1a2332' } },
                x: { ticks: { color: '#666' }, grid: { color: '#1a2332' } }
            }
        }
    });
}

// ============================================
// CRUD RECEITAS
// ============================================

window.openReceitaModal = function() {
    document.getElementById('receitaEditId').value = '';
    document.getElementById('receitaModalTitle').textContent = 'Nova Receita';
    document.getElementById('receitaValor').value = '';
    document.getElementById('receitaOrigem').value = 'Site';
    document.getElementById('receitaData').value = new Date().toISOString().split('T')[0];
    document.getElementById('receitaObs').value = '';
    document.getElementById('receitaModal').classList.remove('hidden');
};

window.closeReceitaModal = function() {
    document.getElementById('receitaModal').classList.add('hidden');
};

window.editReceita = function(id) {
    const receita = receitas.find(r => r.id === id);
    if (!receita) return;

    document.getElementById('receitaEditId').value = id;
    document.getElementById('receitaModalTitle').textContent = 'Editar Receita';
    document.getElementById('receitaValor').value = formatMoney(receita.valor);
    document.getElementById('receitaOrigem').value = receita.origem;
    document.getElementById('receitaData').value = receita.data;
    document.getElementById('receitaObs').value = receita.obs || '';
    document.getElementById('receitaModal').classList.remove('hidden');
};

window.deleteReceita = async function(id) {
    if (!confirm('Deseja realmente excluir esta receita?')) return;

    try {
        await deleteDoc(doc(db, 'receitas', id));
        receitas = receitas.filter(r => r.id !== id);
        renderReceitas();
        renderDashboard();
        alert('Receita excluída com sucesso!');
    } catch (error) {
        alert('Erro ao excluir receita: ' + error.message);
    }
};

document.getElementById('receitaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = document.getElementById('receitaEditId').value;
    const data = {
        valor: parseMoneyInput(document.getElementById('receitaValor').value),
        origem: document.getElementById('receitaOrigem').value,
        data: document.getElementById('receitaData').value,
        obs: document.getElementById('receitaObs').value,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString()
    };

    try {
        if (editId) {
            await updateDoc(doc(db, 'receitas', editId), data);
            const index = receitas.findIndex(r => r.id === editId);
            receitas[index] = { id: editId, ...data };
            alert('Receita atualizada com sucesso!');
        } else {
            data.createdAt = new Date().toISOString();
            const docRef = await addDoc(collection(db, 'receitas'), data);
            receitas.unshift({ id: docRef.id, ...data });
            alert('Receita adicionada com sucesso!');
        }

        closeReceitaModal();
        renderReceitas();
        renderDashboard();
    } catch (error) {
        alert('Erro ao salvar receita: ' + error.message);
    }
});

// ============================================
// CRUD DESPESAS
// ============================================

window.openDespesaModal = function() {
    document.getElementById('despesaEditId').value = '';
    document.getElementById('despesaModalTitle').textContent = 'Nova Despesa';
    document.getElementById('despesaValor').value = '';
    document.getElementById('despesaCategoria').value = 'Tráfego Pago';
    document.getElementById('despesaTipo').value = 'Fixa';
    document.getElementById('despesaData').value = new Date().toISOString().split('T')[0];
    document.getElementById('despesaObs').value = '';
    document.getElementById('despesaModal').classList.remove('hidden');
};

window.closeDespesaModal = function() {
    document.getElementById('despesaModal').classList.add('hidden');
};

window.editDespesa = function(id) {
    const despesa = despesas.find(d => d.id === id);
    if (!despesa) return;

    document.getElementById('despesaEditId').value = id;
    document.getElementById('despesaModalTitle').textContent = 'Editar Despesa';
    document.getElementById('despesaValor').value = formatMoney(despesa.valor);
    document.getElementById('despesaCategoria').value = despesa.categoria;
    document.getElementById('despesaTipo').value = despesa.tipo;
    document.getElementById('despesaData').value = despesa.data;
    document.getElementById('despesaObs').value = despesa.obs || '';
    document.getElementById('despesaModal').classList.remove('hidden');
};

window.deleteDespesa = async function(id) {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;

    try {
        await deleteDoc(doc(db, 'despesas', id));
        despesas = despesas.filter(d => d.id !== id);
        renderDespesas();
        renderDashboard();
        alert('Despesa excluída com sucesso!');
    } catch (error) {
        alert('Erro ao excluir despesa: ' + error.message);
    }
};

document.getElementById('despesaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = document.getElementById('despesaEditId').value;
    const data = {
        valor: parseMoneyInput(document.getElementById('despesaValor').value),
        categoria: document.getElementById('despesaCategoria').value,
        tipo: document.getElementById('despesaTipo').value,
        data: document.getElementById('despesaData').value,
        obs: document.getElementById('despesaObs').value,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString()
    };

    try {
        if (editId) {
            await updateDoc(doc(db, 'despesas', editId), data);
            const index = despesas.findIndex(d => d.id === editId);
            despesas[index] = { id: editId, ...data };
            alert('Despesa atualizada com sucesso!');
        } else {
            data.createdAt = new Date().toISOString();
            const docRef = await addDoc(collection(db, 'despesas'), data);
            despesas.unshift({ id: docRef.id, ...data });
            alert('Despesa adicionada com sucesso!');
        }

        closeDespesaModal();
        renderDespesas();
        renderDashboard();
    } catch (error) {
        alert('Erro ao salvar despesa: ' + error.message);
    }
});

// ============================================
// CRUD TRÁFEGO
// ============================================

window.openTrafegoModal = function() {
    document.getElementById('trafegoEditId').value = '';
    document.getElementById('trafegoModalTitle').textContent = 'Novo Investimento em Tráfego';
    document.getElementById('trafegoValor').value = '';
    document.getElementById('trafegoPlataforma').value = 'Meta Ads';
    document.getElementById('trafegoPeriodo').value = 'Diário';
    document.getElementById('trafegoData').value = new Date().toISOString().split('T')[0];
    document.getElementById('trafegoObs').value = '';
    document.getElementById('trafegoModal').classList.remove('hidden');
};

window.closeTrafegoModal = function() {
    document.getElementById('trafegoModal').classList.add('hidden');
};

window.editTrafego = function(id) {
    const item = trafego.find(t => t.id === id);
    if (!item) return;

    document.getElementById('trafegoEditId').value = id;
    document.getElementById('trafegoModalTitle').textContent = 'Editar Investimento em Tráfego';
    document.getElementById('trafegoValor').value = formatMoney(item.valor);
    document.getElementById('trafegoPlataforma').value = item.plataforma;
    document.getElementById('trafegoPeriodo').value = item.periodo;
    document.getElementById('trafegoData').value = item.data;
    document.getElementById('trafegoObs').value = item.obs || '';
    document.getElementById('trafegoModal').classList.remove('hidden');
};

window.deleteTrafego = async function(id) {
    if (!confirm('Deseja realmente excluir este investimento?')) return;

    try {
        await deleteDoc(doc(db, 'trafego', id));
        trafego = trafego.filter(t => t.id !== id);
        renderTrafego();
        renderDashboard();
        alert('Investimento excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir investimento: ' + error.message);
    }
};

document.getElementById('trafegoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = document.getElementById('trafegoEditId').value;
    const data = {
        valor: parseMoneyInput(document.getElementById('trafegoValor').value),
        plataforma: document.getElementById('trafegoPlataforma').value,
        periodo: document.getElementById('trafegoPeriodo').value,
        data: document.getElementById('trafegoData').value,
        obs: document.getElementById('trafegoObs').value,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString()
    };

    try {
        if (editId) {
            await updateDoc(doc(db, 'trafego', editId), data);
            const index = trafego.findIndex(t => t.id === editId);
            trafego[index] = { id: editId, ...data };
            alert('Investimento atualizado com sucesso!');
        } else {
            data.createdAt = new Date().toISOString();
            const docRef = await addDoc(collection(db, 'trafego'), data);
            trafego.unshift({ id: docRef.id, ...data });
            alert('Investimento adicionado com sucesso!');
        }

        closeTrafegoModal();
        renderTrafego();
        renderDashboard();
    } catch (error) {
        alert('Erro ao salvar investimento: ' + error.message);
    }
});

// ============================================
// EXPORTAR DADOS
// ============================================

window.exportarDados = function() {
    const dados = {
        receitas,
        despesas,
        trafego,
        exportadoEm: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financehub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.exportarPDF = function() {
    alert('Funcionalidade de exportar PDF será implementada em breve!');
};

window.exportarExcel = function() {
    alert('Funcionalidade de exportar Excel será implementada em breve!');
};

console.log('FinanceHub carregado com sucesso!');
