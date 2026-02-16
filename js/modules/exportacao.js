/* ==========================================================================
   PERLIM - Módulo Exportação
   Dispatcher, relatório PDF, exportação bulk (Excel, CSV, JSON)
   ========================================================================== */

// ============================================================================
// DISPATCHER
// ============================================================================

function executarExport(tipo) {
    try {
        const nome = casoActual.id || 'perfil';
        switch (tipo) {
            case 'png':
                radarChart?.downloadPNG(`perfil_${nome}_${casoActual.data}.png`);
                mostrarToast('PNG exportado!', 'success');
                break;
            case 'json':
                exportarJSON(casoActual, `perfil_${nome}_${casoActual.data}.json`);
                mostrarToast('JSON exportado!', 'success');
                break;
            case 'csv':
                exportarCSV(casoActual);
                mostrarToast('CSV exportado!', 'success');
                break;
            case 'pdf':
                gerarRelatorio();
                break;
            case 'word':
                gerarRelatorioWord();
                break;
        }
    } catch (e) {
        console.error('Erro ao exportar:', e);
        mostrarToast('Erro ao exportar', 'error');
    }
}

// ============================================================================
// RELATÓRIO PDF (IMPRESSÃO)
// ============================================================================

function gerarRelatorio() {
    try {
        const win = window.open('', '_blank');
        if (!win) { mostrarToast('Bloqueador de pop-ups activo', 'warning'); return; }
        
        const patterns = document.getElementById('patterns')?.innerHTML || '<p>Sem dados</p>';
        const hypotheses = document.getElementById('hypotheses')?.innerHTML || '<p>Sem dados</p>';
        const intervention = document.getElementById('intervention')?.innerHTML || '<p>Sem dados</p>';
        
        const nomeCaso = (typeof criancaActual !== 'undefined' && criancaActual) ? criancaActual.nome : (casoActual.nome || 'Sem nome');
        const codigoCaso = (typeof criancaActual !== 'undefined' && criancaActual) ? criancaActual.codigo : (casoActual.codigo || casoActual.id || '-');
        const diagnostico = (typeof criancaActual !== 'undefined' && criancaActual) ? criancaActual.diagnostico : '';
        
        let provasHtml = '';
        if (casoActual.provasAplicadas?.length > 0) {
            provasHtml = `<div class="section"><h2>Provas Aplicadas</h2><table class="provas-table"><thead><tr><th>Prova</th><th>Valor</th><th>Escala</th><th>Comp</th></tr></thead><tbody>${casoActual.provasAplicadas.map(p => `<tr><td>${p.nome || p.prova || '-'}</td><td>${p.valor || '-'}</td><td>${(p.escala || '').toUpperCase()}</td><td><b>${p.competencia || '-'}</b>/10</td></tr>`).join('')}</tbody></table></div>`;
        }
        
        const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>PERLIM — Relatório</title>
<style>body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;font-size:11pt;color:#333;line-height:1.6}
.header{display:flex;align-items:center;border-bottom:3px solid #00A79D;padding-bottom:15px;margin-bottom:20px}
.header h1{color:#00A79D;font-size:18pt;margin:0}.header p{margin:2px 0;font-size:9pt;color:#666}
h2{color:#00A79D;font-size:14pt;border-bottom:1px solid #ddd;padding-bottom:5px;margin-top:20px}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9pt;margin-right:5px}
.tag-danger{background:#FFCDD2;color:#C62828}.tag-warning{background:#FFE0B2;color:#E65100}.tag-success{background:#C8E6C9;color:#2E7D32}.tag-info{background:#BBDEFB;color:#1565C0}
.radar-container{text-align:center;margin:20px 0}.radar-container img{max-width:500px}
.provas-table{width:100%;border-collapse:collapse}.provas-table th,.provas-table td{border:1px solid #ddd;padding:6px 10px;text-align:left}.provas-table th{background:#f5f5f5}
.footer{margin-top:30px;border-top:2px solid #00A79D;padding-top:10px;font-size:8pt;color:#888;display:flex;justify-content:space-between}
@media print{body{padding:10mm}}</style></head><body>
<div class="header"><div><h1>PERLIM</h1><p>Perfil Linguístico Multidimensional</p></div>
<div style="margin-left:auto;text-align:right"><p><strong>${nomeCaso}</strong></p><p>${codigoCaso} | ${casoActual.idade || '-'}</p><p>${casoActual.data ? new Date(casoActual.data).toLocaleDateString('pt-PT') : '-'}</p></div></div>
${diagnostico ? `<p><strong>Diagnóstico/Hipótese:</strong> ${diagnostico}</p>` : ''}
<div class="radar-container"><img src="${radarChart?.toDataURL() || ''}" alt="Perfil"></div>
${provasHtml}
<div class="section"><h2>Padrões Identificados</h2>${patterns}</div>
<div class="section"><h2>Hipóteses Diagnósticas</h2>${hypotheses}</div>
<div class="section"><h2>Prioridades de Intervenção</h2>${intervention}</div>
<div class="footer"><div><span>CAIDI</span></div><div><p>PERLIM — Perfil Linguístico Multidimensional</p><p>Modelo: Alves (2019) · Operacionalização: J. Miguel</p></div>
<div><p>Gerado em ${new Date().toLocaleDateString('pt-PT')}</p><p>© ${new Date().getFullYear()} Joana Miguel</p></div></div>
<script>window.onload=function(){setTimeout(()=>window.print(),500)}</script></body></html>`;
        
        win.document.write(html);
        win.document.close();
        mostrarToast('Relatório gerado!', 'success');
    } catch (e) {
        console.error('Erro ao gerar relatório:', e);
        mostrarToast('Erro ao gerar relatório', 'error');
    }
}

// ============================================================================
// EXPORTAÇÃO BULK (PAINEL DE GESTÃO)
// ============================================================================

async function exportarDados(formato) {
    try {
        const dataDe = document.getElementById('export-data-de')?.value;
        const dataAte = document.getElementById('export-data-ate')?.value;
        
        let dados = dadosGestao.avaliacoes;
        
        if (dataDe || dataAte) {
            dados = dados.filter(a => {
                if (!a.data_avaliacao) return true;
                const d = new Date(a.data_avaliacao);
                if (dataDe && d < new Date(dataDe)) return false;
                if (dataAte && d > new Date(dataAte)) return false;
                return true;
            });
        }
        
        if (dados.length === 0) {
            mostrarToast('Nenhuma avaliação para exportar', 'warning');
            return;
        }
        
        switch (formato) {
            case 'excel': exportarParaExcel(dados); break;
            case 'csv': exportarParaCSV(dados); break;
            case 'json': exportarParaJSON(dados); break;
        }
    } catch (e) {
        console.error('Erro ao exportar dados:', e);
    }
}

function exportarParaExcel(dados) {
    try {
        carregarBibliotecaXLSX().then(() => {
            const dominios = ['Fono', 'Morf', 'Sint', 'Sem', 'Prag'];
            const niveis = ['Imp', 'Exp'];
            const circuitos = ['Comp', 'Expr'];
            const modalidades = ['Oral', 'Esc'];
            
            const rows = dados.map(a => {
                const row = { 'Código': a.codigo || '', 'Nome': a.nome || '', 'Idade': a.idade || '', 'Data': a.data_avaliacao || '', 'Avaliador': a.avaliador || '' };
                for (let i = 0; i < 40; i++) {
                    const d = Math.floor(i / 8), resto = i % 8;
                    const n = Math.floor(resto / 4), c = Math.floor((resto % 4) / 2), m = resto % 2;
                    row[`${dominios[d]}_${niveis[n]}_${circuitos[c]}_${modalidades[m]}`] = a.competencias?.[i] ?? '';
                }
                return row;
            });
            
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');
            XLSX.writeFile(wb, `PERLIM_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
            mostrarToast('Excel exportado!', 'success');
        }).catch(() => mostrarToast('Erro ao carregar biblioteca Excel', 'error'));
    } catch (e) {
        console.error('Erro ao exportar Excel:', e);
    }
}

function exportarParaCSV(dados) {
    try {
        let csv = 'Código,Nome,Idade,Data,';
        for (let i = 0; i < 40; i++) csv += `Seg${i},`;
        csv = csv.slice(0, -1) + '\n';
        
        dados.forEach(a => {
            csv += `"${a.codigo || ''}","${a.nome || ''}","${a.idade || ''}","${a.data_avaliacao || ''}",`;
            for (let i = 0; i < 40; i++) csv += `${a.competencias?.[i] ?? ''},`;
            csv = csv.slice(0, -1) + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PERLIM_Export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarToast('CSV exportado!', 'success');
    } catch (e) {
        console.error('Erro ao exportar CSV:', e);
    }
}

function exportarParaJSON(dados) {
    try {
        const json = JSON.stringify(dados, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PERLIM_Export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarToast('JSON exportado!', 'success');
    } catch (e) {
        console.error('Erro ao exportar JSON:', e);
    }
}

// ============================================================================
// IMPORTAÇÃO
// ============================================================================

async function iniciarImportacao(tipo) {
    try {
        const input = document.getElementById('input-import-file');
        if (input) {
            input.accept = tipo === 'json' ? '.json' : '.xlsx,.xls';
            input.click();
        }
    } catch (e) {
        console.error('Erro ao iniciar importação:', e);
    }
}

async function processarImportacao(e) {
    try {
        const file = e.target?.files?.[0];
        if (!file) return;
        
        if (file.name.endsWith('.json')) {
            const dados = await importarJSON(file);
            if (Array.isArray(dados)) {
                for (const caso of dados) {
                    await API.guardarCaso(caso);
                }
                mostrarToast(`${dados.length} casos importados`, 'success');
            } else {
                await API.guardarCaso(dados);
                mostrarToast('Caso importado', 'success');
            }
        } else {
            await importarExcel(file);
        }
        
        await carregarDadosGestao();
    } catch (err) {
        mostrarToast('Erro ao importar: ' + err.message, 'error');
    }
}

async function importarExcel(file) {
    try {
        await carregarBibliotecaXLSX();
        
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        let importados = 0;
        for (const row of rows) {
            try {
                const caso = {
                    codigo: row['Código'] || row['codigo'] || '',
                    nome: row['Nome'] || row['nome'] || '',
                    idade: row['Idade'] || row['idade'] || '',
                    data_avaliacao: row['Data'] || row['data'] || '',
                    avaliador: row['Avaliador'] || row['avaliador'] || '',
                    competencias: new Array(40).fill(null)
                };
                
                for (let i = 0; i < 40; i++) {
                    const key = Object.keys(row).find(k => k.includes(`Seg${i}`) || k.endsWith(`_${i}`));
                    const val = key ? row[key] : row[`Seg${i}`];
                    caso.competencias[i] = val !== undefined && val !== '' ? (isNaN(parseFloat(val)) ? null : parseFloat(val)) : null;
                }
                
                await API.guardarCaso(caso);
                importados++;
            } catch (err) {
                console.error('Erro ao importar linha:', err);
            }
        }
        
        mostrarToast(`${importados} avaliações importadas do Excel`, 'success');
    } catch (e) {
        console.error('Erro ao importar Excel:', e);
        throw e;
    }
}

// ============================================================================
// LAZY LOADING DE BIBLIOTECAS
// ============================================================================

function carregarBibliotecaXLSX() {
    if (typeof XLSX !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Falha ao carregar biblioteca xlsx'));
        document.head.appendChild(script);
    });
}

function carregarBibliotecaDocx() {
    if (typeof docx !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.min.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Falha ao carregar biblioteca docx'));
        document.head.appendChild(script);
    });
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function inicializarExportacao() {
    try {
        document.getElementById('btn-export')?.addEventListener('click', () => abrirModal('modal-export'));
        
        document.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', () => {
                executarExport(btn.dataset.export);
                fecharModal('modal-export');
            });
        });
        
        document.getElementById('btn-import-json')?.addEventListener('click', () => iniciarImportacao('json'));
        document.getElementById('btn-import-excel')?.addEventListener('click', () => iniciarImportacao('excel'));
        document.getElementById('input-import-file')?.addEventListener('change', processarImportacao);
        document.getElementById('btn-export-excel')?.addEventListener('click', () => exportarDados('excel'));
        document.getElementById('btn-export-csv')?.addEventListener('click', () => exportarDados('csv'));
        document.getElementById('btn-export-json-all')?.addEventListener('click', () => exportarDados('json'));
        
        console.log('✅ Módulo Exportação inicializado');
    } catch (e) {
        console.error('❌ Erro ao inicializar módulo Exportação:', e);
    }
}
