document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const monthFilter = document.getElementById('month-filter');
    const totalVendasEl = document.getElementById('total-vendas');
    const ticketMedioEl = document.getElementById('ticket-medio');
    const totalPedidosEl = document.getElementById('total-pedidos');

    // Contextos dos gráficos
    const ctxBar = document.getElementById('graficoVendasMes').getContext('2d');
    const ctxPie = document.getElementById('graficoVendasProduto').getContext('2d');

    let allSalesData = [];
    let barChart, pieChart;

    // Função para formatar valores em moeda BRL
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Função para buscar os dados do JSON
    async function fetchData() {
        try {
            const response = await fetch('data.json');
            allSalesData = await response.json();
            initializeDashboard();
        } catch (error) {
            console.error('Erro ao buscar os dados:', error);
        }
    }

    // Função para inicializar o dashboard após os dados serem carregados
    function initializeDashboard() {
        // Inicializa os gráficos com estrutura vazia
        barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total de Vendas por Mês',
                    data: [],
                    backgroundColor: '#007bff',
                    borderColor: '#0056b3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // << CORREÇÃO APLICADA
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        pieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    label: 'Vendas por Produto',
                    data: [],
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6610f2'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false // << CORREÇÃO APLICADA
            }
        });
        
        // Atualiza o dashboard com todos os dados inicialmente
        updateDashboard('todos');

        // Adiciona o listener de evento para o filtro de mês
        monthFilter.addEventListener('change', (e) => {
            updateDashboard(e.target.value);
        });
    }

    // Função principal que atualiza todo o dashboard
    function updateDashboard(selectedMonth) {
        // 1. Filtrar os dados
        const filteredData = selectedMonth === 'todos'
            ? allSalesData
            : allSalesData.filter(sale => {
                const saleMonth = new Date(sale.data).getMonth() + 1; // getMonth() é 0-indexado
                return saleMonth.toString() === selectedMonth;
            });

        // 2. Calcular e atualizar os KPIs
        updateKPIs(filteredData);
        
        // 3. Atualizar os gráficos
        updateCharts(filteredData);
    }

    // Função para calcular e exibir os KPIs
    function updateKPIs(data) {
        const totalVendas = data.reduce((sum, sale) => sum + (sale.preco_unit * sale.quantidade), 0);
        const totalPedidos = data.length;
        const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

        totalVendasEl.textContent = formatCurrency(totalVendas);
        ticketMedioEl.textContent = formatCurrency(ticketMedio);
        totalPedidosEl.textContent = totalPedidos;
    }

    // Função para processar dados e atualizar os gráficos
    function updateCharts(data) {
        // Processar dados para o Gráfico de Barras (Vendas por Mês)
        const vendasPorMes = {};
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        data.forEach(sale => {
            const monthIndex = new Date(sale.data).getMonth();
            const monthName = monthNames[monthIndex];
            const saleTotal = sale.preco_unit * sale.quantidade;
            
            if (vendasPorMes[monthName]) {
                vendasPorMes[monthName] += saleTotal;
            } else {
                vendasPorMes[monthName] = saleTotal;
            }
        });

        const barLabels = Object.keys(vendasPorMes);
        const barData = Object.values(vendasPorMes);
        
        // Atualizar Gráfico de Barras
        barChart.data.labels = barLabels;
        barChart.data.datasets[0].data = barData;
        barChart.update();

        // Processar dados para o Gráfico de Pizza (Vendas por Produto)
        const vendasPorProduto = {};
        data.forEach(sale => {
            const saleTotal = sale.preco_unit * sale.quantidade;
            if (vendasPorProduto[sale.produto]) {
                vendasPorProduto[sale.produto] += saleTotal;
            } else {
                vendasPorProduto[sale.produto] = saleTotal;
            }
        });
        
        const pieLabels = Object.keys(vendasPorProduto);
        const pieData = Object.values(vendasPorProduto);

        // Atualizar Gráfico de Pizza
        pieChart.data.labels = pieLabels;
        pieChart.data.datasets[0].data = pieData;
        pieChart.update();
    }

    // Inicia o processo buscando os dados
    fetchData();
});