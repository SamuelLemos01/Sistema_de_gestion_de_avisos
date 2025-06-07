let currentData = [];
let currentChart = null;
let currentAvisosChart = null; // Nuevo gráfico para avisos
let fileType = null;
let allMonthsData = {}; // Almacenará los datos organizados por mes
let monthlySummary = {}; // Almacenará los resúmenes por mes

// Variables para avisos
let allWeeksData = {}; // Almacenará los datos organizados por semana
let weeklySummary = {}; // Almacenará los resúmenes por semana
let encargadosSummary = {}; // Almacenará resúmenes por encargado

// Función para ordenar meses cronológicamente
function getMonthOrder() {
    return {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
        'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };
}

function sortMonths(months) {
    const monthOrder = getMonthOrder();
    return months.sort((a, b) => {
        const orderA = monthOrder[a.toLowerCase()] || 999;
        const orderB = monthOrder[b.toLowerCase()] || 999;
        return orderA - orderB;
    });
}

// Función para detectar el tipo de archivo
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Función para procesar archivos XLSX
function processXLSXFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) {
                alert('El archivo XLSX está vacío');
                return;
            }
            
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            currentData = rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            }).filter(row => {
                return Object.values(row).some(val => val && val.toString().trim() !== '');
            });
            
            console.log('Datos XLSX cargados:', currentData.length, 'registros');
            console.log('Muestra de datos:', currentData.slice(0, 3));
            
            if (currentData.length === 0) {
                alert('El archivo XLSX no contiene datos válidos');
                return;
            }
            
            if (fileType === 'abril') {
                organizeDataByMonth();
                calculateMonthlySummaries();
            } else {
                organizeAvisosByWeek();
                calculateWeeklySummaries();
            }
            
            renderData();
            
        } catch (error) {
            console.error('Error al procesar XLSX:', error);
            alert(`Error al procesar el archivo XLSX: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        alert('Error al leer el archivo XLSX');
    };
    
    reader.readAsArrayBuffer(file);
}

// Función para procesar archivos CSV
function processCSVFile(file) {
    Papa.parse(file, {
        header: true,
        delimiter: '',
        skipEmptyLines: 'greedy',
        encoding: 'UTF-8',
        dynamicTyping: false,
        complete: function(results) {
            console.log('Datos CSV cargados:', results.data.length, 'registros');
            console.log('Headers detectados:', results.meta.fields);
            
            if (results.errors && results.errors.length > 0) {
                console.warn('Errores en CSV:', results.errors);
            }
            
            currentData = results.data.filter(row => {
                return Object.values(row).some(val => val && val.toString().trim() !== '');
            });
            
            console.log('Datos filtrados:', currentData.length, 'registros');
            console.log('Muestra de datos:', currentData.slice(0, 3));
            
            if (currentData.length === 0) {
                alert('El archivo CSV está vacío o no contiene datos válidos.\nVerifique que el archivo tenga la estructura correcta.');
                return;
            }
            
            const requiredColumns = fileType === 'abril' 
                ? ['Fecha de aviso', 'Grupo planif.', 'Status sistema'] 
                : ['Semana', 'Sistema', 'Grupo planif.', 'Encargado', 'atrasados'];
            
            const missingColumns = requiredColumns.filter(col => 
                !results.meta.fields || !results.meta.fields.includes(col)
            );
            
            if (missingColumns.length > 0) {
                alert(`Faltan columnas requeridas en el archivo CSV: ${missingColumns.join(', ')}\n\nColumnas disponibles: ${results.meta.fields ? results.meta.fields.join(', ') : 'No detectadas'}`);
                return;
            }
            
            if (fileType === 'abril') {
                organizeDataByMonth();
                calculateMonthlySummaries();
            } else {
                organizeAvisosByWeek();
                calculateWeeklySummaries();
            }
            
            renderData();
        },
        error: function(error) {
            console.error('Error al procesar CSV:', error);
            alert(`Error al procesar el archivo CSV: ${error.message}\n\nSugerencias:\n- Verifique que el archivo esté en formato UTF-8\n- Asegúrese de que use delimitadores estándar (coma o punto y coma)\n- Revise que no haya caracteres especiales en los headers`);
        }
    });
}

function processFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor seleccione un archivo CSV o XLSX');
        return;
    }
    
    // Determinar el tipo de archivo por el nombre
    fileType = file.name.toLowerCase().includes('abril') ? 'abril' : 'avisos';
    
    // Determinar la extensión del archivo
    const extension = getFileExtension(file.name);
    
    if (extension === 'csv') {
        processCSVFile(file);
    } else if (extension === 'xlsx') {
        processXLSXFile(file);
    } else {
        alert('Tipo de archivo no soportado. Por favor seleccione un archivo CSV o XLSX');
        return;
    }
}

function organizeDataByMonth() {
    allMonthsData = {};
    
    currentData.forEach(row => {
        let month = 'abril'; // valor por defecto
        
        // Manejar diferentes tipos de datos para la fecha
        const fechaValue = row['Fecha de aviso'];
        if (fechaValue) {
            if (typeof fechaValue === 'string') {
                month = fechaValue.toLowerCase().trim();
            } else if (fechaValue instanceof Date) {
                // Si es un objeto Date, extraer el mes
                const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                month = monthNames[fechaValue.getMonth()];
            } else if (typeof fechaValue === 'number') {
                // Si es un número (fecha serial de Excel), convertir a fecha
                const date = new Date((fechaValue - 25569) * 86400 * 1000);
                const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                month = monthNames[date.getMonth()];
            } else {
                // Intentar convertir a string como último recurso
                month = String(fechaValue).toLowerCase().trim();
            }
        }
        
        if (!allMonthsData[month]) {
            allMonthsData[month] = [];
        }
        
        allMonthsData[month].push(row);
    });
    
    // Actualizar el selector de meses con orden cronológico
    const monthFilter = document.getElementById('monthFilter');
    monthFilter.innerHTML = '<option value="todos">Todos los meses</option>';
    
    const sortedMonths = sortMonths(Object.keys(allMonthsData));
    
    sortedMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month.charAt(0).toUpperCase() + month.slice(1);
        monthFilter.appendChild(option);
    });
}

function calculateMonthlySummaries() {
    monthlySummary = {};
    
    Object.keys(allMonthsData).forEach(month => {
        const data = allMonthsData[month];
        const grupos = {
            'ELE': { 
                MECE: 0, MECE_MIMP: 0, MECE_ORAS: 0, 
                METR: 0, METR_MIMP: 0, METR_ORAS: 0 
            },
            'ETN': { 
                MECE: 0, MECE_MIMP: 0, MECE_ORAS: 0, 
                METR: 0, METR_MIMP: 0, METR_ORAS: 0 
            }
        };

        // Procesar cada registro
        data.forEach(row => {
            const grupo = row['Grupo planif.'] || 'N/A';
            if (!grupos[grupo]) return;
            
            const status = (row['Status sistema'] || '').toUpperCase().trim();
            
            // Clasificación de estados
            if (status.includes('MECE')) {
                if (status.includes('MIMP')) {
                    grupos[grupo].MECE_MIMP++;
                } else if (status.includes('ORAS')) {
                    grupos[grupo].MECE_ORAS++;
                } else {
                    grupos[grupo].MECE++;
                }
            }
            
            if (status.includes('METR')) {
                if (status.includes('MIMP')) {
                    grupos[grupo].METR_MIMP++;
                } else if (status.includes('ORAS')) {
                    grupos[grupo].METR_ORAS++;
                } else {
                    grupos[grupo].METR++;
                }
            }
        });

        // Calcular totales
        const totalELE = Object.values(grupos.ELE).reduce((a, b) => a + b, 0);
        const totalETN = Object.values(grupos.ETN).reduce((a, b) => a + b, 0);
        const cerradosELE = grupos.ELE.MECE + grupos.ELE.MECE_MIMP;
        const cerradosETN = grupos.ETN.MECE + grupos.ETN.MECE_MIMP;
        
        const porcentajeCerradosELE = totalELE > 0 ? 
            ((cerradosELE / totalELE) * 100).toFixed(1) : '0.0';
        const porcentajeCerradosETN = totalETN > 0 ? 
            ((cerradosETN / totalETN) * 100).toFixed(1) : '0.0';
        const totalGeneral = totalELE + totalETN;
        const totalPorcentajeCerrados = totalGeneral > 0 ? 
            ((cerradosELE + cerradosETN) / totalGeneral * 100).toFixed(1) : '0.0';

        monthlySummary[month] = {
            grupos,
            totalELE,
            totalETN,
            cerradosELE,
            cerradosETN,
            porcentajeCerradosELE,
            porcentajeCerradosETN,
            totalPorcentajeCerrados
        };
    });
}

function filterByMonth() {
    const selectedMonth = document.getElementById('monthFilter').value;
    
    if (selectedMonth === 'todos') {
        // Mostrar todos los datos
        renderStatusTable(currentData);
        renderSummaryTable(); // Mostrar tabla completa con todos los meses
        renderChart(); // Mostrar gráfico completo con todos los meses
    } else {
        // Mostrar solo los datos del mes seleccionado
        renderStatusTable(allMonthsData[selectedMonth]);
        renderSummaryTableFiltered(selectedMonth); // Nueva función para mostrar solo el mes seleccionado
        renderChartFiltered(selectedMonth); // Nueva función para mostrar solo el mes seleccionado
    }
}

function renderData() {
    document.getElementById('abrilSection').classList.add('hidden');
    document.getElementById('avisosSection').classList.add('hidden');
    document.getElementById('rawDataSection').classList.add('hidden');
    
    if (fileType === 'abril') {
        renderStatusTable(currentData);
        renderSummaryTable();
        renderChart();
        document.getElementById('abrilSection').classList.remove('hidden');
    } else {
        renderAvisosPlanificacionTable();
        renderAvisosData();
        renderAvisosChart();
        document.getElementById('avisosSection').classList.remove('hidden');
    }
    
    renderRawData();
    document.getElementById('rawDataSection').classList.remove('hidden');
}

function renderRawData() {
    if (currentData.length === 0) {
        document.getElementById('rawDataTable').innerHTML = '<div class="no-data">No hay datos para mostrar</div>';
        return;
    }

    // Obtener valores únicos para los filtros
    const grupos = [...new Set(currentData.map(row => row['Grupo planif.'] || 'N/A'))].filter(g => g);
    const statuses = [...new Set(currentData.map(row => {
        const status = (row['Status sistema'] || '').toUpperCase().trim();
        if (status.includes('MECE')) {
            if (status.includes('MIMP')) return 'MECE MIMP';
            if (status.includes('ORAS')) return 'MECE ORAS';
            return 'MECE';
        }
        if (status.includes('METR')) {
            if (status.includes('MIMP')) return 'METR MIMP';
            if (status.includes('ORAS')) return 'METR ORAS';
            return 'METR';
        }
        return '';
    }))].filter(s => s);
    
    // Para archivo abril.csv - filtro por mes
    let monthFilterControl = '';
    if (fileType === 'abril') {
        const months = [...new Set(currentData.map(row => {
            const dateValue = row['Fecha de aviso'] || '';
            let month = '';
            
            if (dateValue) {
                if (typeof dateValue === 'string') {
                    month = dateValue.toLowerCase().trim().split(' ')[0]; // Extraer el mes
                } else if (dateValue instanceof Date) {
                    // Si es un objeto Date, extraer el mes
                    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    month = monthNames[dateValue.getMonth()];
                } else if (typeof dateValue === 'number') {
                    // Si es un número (fecha serial de Excel), convertir a fecha
                    const date = new Date((dateValue - 25569) * 86400 * 1000);
                    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    month = monthNames[date.getMonth()];
                } else {
                    // Intentar convertir a string como último recurso
                    month = String(dateValue).toLowerCase().trim().split(' ')[0];
                }
            }
            
            return month;
        }))].filter(m => m);
        monthFilterControl = `
            <div class="filter-control">
                <label>Filtrar por mes:</label>
                <select id="rawMonthFilter" onchange="applyRawDataFilters()">
                    <option value="todos">Todos los meses</option>
                    ${months.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
            </div>
        `;
    }

    // Para archivo avisos.csv - filtro por semana
    let weekFilterControl = '';
    if (fileType === 'avisos') {
        const weeks = [...new Set(currentData.map(row => row['Semana'] || '').filter(w => w))];
        weekFilterControl = `
            <div class="filter-control">
                <label>Filtrar por semana:</label>
                <select id="rawWeekFilter" onchange="applyRawDataFilters()">
                    <option value="todos">Todas las semanas</option>
                    ${weeks.map(w => `<option value="${w}">${w}</option>`).join('')}
                </select>
            </div>
        `;
    }

    // Crear controles de filtro
    let filterControls = `
        <div class="raw-data-filters">
            <div class="filter-control">
                <label>Filtrar por grupo:</label>
                <select id="rawGroupFilter" onchange="applyRawDataFilters()">
                    <option value="todos">Todos los grupos</option>
                    ${grupos.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
            </div>
            <div class="filter-control">
                <label>Filtrar por estado:</label>
                <select id="rawStatusFilter" onchange="applyRawDataFilters()">
                    <option value="todos">Todos los estados</option>
                    ${statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
            ${monthFilterControl}
            ${weekFilterControl}
            <div class="filter-control">
                <button onclick="resetRawDataFilters()">Resetear filtros</button>
            </div>
        </div>
    `;

    // Obtener todas las columnas
    const allKeys = new Set();
    currentData.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys);

    // Crear checkboxes por columna
    let checkboxControls = `
        <div class="column-filter">
            <label><strong>Seleccionar columnas visibles:</strong></label>
            <div class="checkbox-container">
                ${headers.map(h => `
                    <label class="checkbox-label">
                        <input type="checkbox" class="column-checkbox" value="${h}" checked onchange="toggleColumnVisibilityCheckboxes()"> ${h}
                    </label>
                `).join('')}
            </div>
        </div>
    `;

    // Construir tabla
    let tableHTML = `
        ${filterControls}
        ${checkboxControls}
        <div class="raw-data-container">
            <table class="raw-data-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th data-column="${header}">${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    currentData.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            const value = row[header] || '';
            tableHTML += `<td data-column="${header}" title="${value}">${value}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
        <div class="raw-data-info">
            <span>Total de registros: <strong>${currentData.length}</strong></span>
            <span>Columnas: <strong>${headers.length}</strong></span>
        </div>
    `;

    document.getElementById('rawDataTable').innerHTML = tableHTML;
}

// Función para filtrar columnas
function filterColumns() {
    const filter = document.getElementById('columnFilter').value.toLowerCase();
    const headers = document.querySelectorAll('.raw-data-table th');
    
    headers.forEach(header => {
        const columnName = header.getAttribute('data-column').toLowerCase();
        const columnIndex = header.cellIndex;
        const shouldShow = columnName.includes(filter);
        
        header.style.display = shouldShow ? '' : 'none';
        
        // Ocultar/mostrar celdas correspondientes en cada fila
        document.querySelectorAll('.raw-data-table tr').forEach(row => {
            const cell = row.cells[columnIndex];
            if (cell) cell.style.display = shouldShow ? '' : 'none';
        });
    });
}

function renderStatusTable(data) {
    // Inicializar contadores para ELE y ETN
    const grupos = {
        'ELE': { 
            MECE: 0, MECE_MIMP: 0, MECE_ORAS: 0, 
            METR: 0, METR_MIMP: 0, METR_ORAS: 0 
        },
        'ETN': { 
            MECE: 0, MECE_MIMP: 0, MECE_ORAS: 0, 
            METR: 0, METR_MIMP: 0, METR_ORAS: 0 
        }
    };

    // Procesar cada registro
    data.forEach(row => {
        const grupo = row['Grupo planif.'] || 'N/A';
        if (!grupos[grupo]) return;
        
        const status = (row['Status sistema'] || '').toUpperCase().trim();
        
        // Clasificación de estados
        if (status.includes('MECE')) {
            if (status.includes('MIMP')) {
                grupos[grupo].MECE_MIMP++;
            } else if (status.includes('ORAS')) {
                grupos[grupo].MECE_ORAS++;
            } else {
                grupos[grupo].MECE++;
            }
        }
        
        if (status.includes('METR')) {
            if (status.includes('MIMP')) {
                grupos[grupo].METR_MIMP++;
            } else if (status.includes('ORAS')) {
                grupos[grupo].METR_ORAS++;
            } else {
                grupos[grupo].METR++;
            }
        }
    });

    // Calcular totales
    const totalELE = Object.values(grupos.ELE).reduce((a, b) => a + b, 0);
    const totalETN = Object.values(grupos.ETN).reduce((a, b) => a + b, 0);
    const totalGeneral = totalELE + totalETN;

    // Obtener el mes actual (para mostrar en la tabla)
    const selectedMonth = document.getElementById('monthFilter').value;
    let displayMonth;
    
    if (selectedMonth === 'todos') {
        displayMonth = 'Todos los meses';
    } else {
        displayMonth = selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1);
    }

    // Solo calcular porcentajes si no estamos en "Todos los meses"
    const porcentajeCerradosELE = selectedMonth === 'todos' ? '' : 
        (totalELE > 0 ? ((grupos.ELE.MECE + grupos.ELE.MECE_MIMP) / totalELE * 100).toFixed(1) + '%' : '0.0%');
    
    const porcentajeCerradosETN = selectedMonth === 'todos' ? '' : 
        (totalETN > 0 ? ((grupos.ETN.MECE + grupos.ETN.MECE_MIMP) / totalETN * 100).toFixed(1) + '%' : '0.0%');
    
    const totalPorcentajeCerrados = selectedMonth === 'todos' ? '' : 
        (totalGeneral > 0 ? ((grupos.ELE.MECE + grupos.ELE.MECE_MIMP + grupos.ETN.MECE + grupos.ETN.MECE_MIMP) / totalGeneral * 100).toFixed(1) + '%' : '0.0%');

    // Generar tabla HTML con los resultados de estados
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Grupo plan</th>
                    <th>Fecha de aviso</th>
                    <th>MECE</th>
                    <th>MECE MIMP</th>
                    <th>MECE ORAS</th>
                    <th>METR</th>
                    <th>METR MIMP</th>
                    <th>METR ORAS</th>
                    <th>Total general</th>
                    <th>%AV CERRADOS</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>ELE</td>
                    <td>${displayMonth}</td>
                    <td class="status-mece">${grupos.ELE.MECE}</td>
                    <td class="status-mece">${grupos.ELE.MECE_MIMP}</td>
                    <td class="status-mece">${grupos.ELE.MECE_ORAS}</td>
                    <td class="status-metr">${grupos.ELE.METR}</td>
                    <td class="status-metr">${grupos.ELE.METR_MIMP}</td>
                    <td class="status-metr">${grupos.ELE.METR_ORAS}</td>
                    <td>${totalELE}</td>
                    <td>${porcentajeCerradosELE}</td>
                </tr>
                <tr>
                    <td>ETN</td>
                    <td>${displayMonth}</td>
                    <td class="status-mece">${grupos.ETN.MECE}</td>
                    <td class="status-mece">${grupos.ETN.MECE_MIMP}</td>
                    <td class="status-mece">${grupos.ETN.MECE_ORAS}</td>
                    <td class="status-metr">${grupos.ETN.METR}</td>
                    <td class="status-metr">${grupos.ETN.METR_MIMP}</td>
                    <td class="status-metr">${grupos.ETN.METR_ORAS}</td>
                    <td>${totalETN}</td>
                    <td>${porcentajeCerradosETN}</td>
                </tr>
                <tr style="font-weight: bold; background: #f0f0f0;">
                    <td>Total general</td>
                    <td></td>
                    <td>${grupos.ELE.MECE + grupos.ETN.MECE}</td>
                    <td>${grupos.ELE.MECE_MIMP + grupos.ETN.MECE_MIMP}</td>
                    <td>${grupos.ELE.MECE_ORAS + grupos.ETN.MECE_ORAS}</td>
                    <td>${grupos.ELE.METR + grupos.ETN.METR}</td>
                    <td>${grupos.ELE.METR_MIMP + grupos.ETN.METR_MIMP}</td>
                    <td>${grupos.ELE.METR_ORAS + grupos.ETN.METR_ORAS}</td>
                    <td>${totalGeneral}</td>
                    <td>${totalPorcentajeCerrados}</td>
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('abrilStatusTable').innerHTML = tableHTML;
}

function renderSummaryTable() {
    // Generar tabla de resumen con cerrados y porcentajes (todos los meses)
    const sortedMonths = sortMonths(Object.keys(monthlySummary));
    
    let summaryHTML = `
        <table class="summary-table">
            <thead>
                <tr>
                    <th></th>
                    ${sortedMonths.map(month => 
                        `<th>${month.toUpperCase()}</th>`
                    ).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Cerrados ELE</td>
                    ${sortedMonths.map(month => 
                        `<td>${monthlySummary[month].cerradosELE}</td>`
                    ).join('')}
                </tr>
                <tr>
                    <td>Total gen ELE</td>
                    ${sortedMonths.map(month => 
                        `<td>${monthlySummary[month].totalELE}</td>`
                    ).join('')}
                </tr>
                <tr>
                    <td>% Cerrados ELE</td>
                    ${sortedMonths.map(month => 
                        `<td>${monthlySummary[month].porcentajeCerradosELE}%</td>`
                    ).join('')}
                </tr>
                <tr>
                    <td>Cerrados ETN</td>
                    ${sortedMonths.map(month => 
                        `<td>${monthlySummary[month].cerradosETN}</td>`
                    ).join('')}
                </tr>
                <tr>
                    <td>Total gen ETN</td>
                    ${sortedMonths.map(month => 
                        `<td>${monthlySummary[month].totalETN}</td>`
                    ).join('')}
                </tr>
                <tr>
                    <td>% Cerrados ETN</td>
                    ${sortedMonths.map(month => 
                        `<td>${monthlySummary[month].porcentajeCerradosETN}%</td>`
                    ).join('')}
                </tr>
                <tr style="font-weight: bold;">
                    <td>TOTAL</td>
                    ${sortedMonths.map(month => 
                        `<td>${monthlySummary[month].totalPorcentajeCerrados}%</td>`
                    ).join('')}
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('abrilSummaryTable').innerHTML = summaryHTML;
}

function renderSummaryTableFiltered(selectedMonth) {
    // Generar tabla de resumen solo para el mes seleccionado
    const monthData = monthlySummary[selectedMonth];
    
    let summaryHTML = `
        <table class="summary-table">
            <thead>
                <tr>
                    <th></th>
                    <th>${selectedMonth.toUpperCase()}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Cerrados ELE</td>
                    <td>${monthData.cerradosELE}</td>
                </tr>
                <tr>
                    <td>Total gen ELE</td>
                    <td>${monthData.totalELE}</td>
                </tr>
                <tr>
                    <td>% Cerrados ELE</td>
                    <td>${monthData.porcentajeCerradosELE}%</td>
                </tr>
                <tr>
                    <td>Cerrados ETN</td>
                    <td>${monthData.cerradosETN}</td>
                </tr>
                <tr>
                    <td>Total gen ETN</td>
                    <td>${monthData.totalETN}</td>
                </tr>
                <tr>
                    <td>% Cerrados ETN</td>
                    <td>${monthData.porcentajeCerradosETN}%</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td>TOTAL</td>
                    <td>${monthData.totalPorcentajeCerrados}%</td>
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('abrilSummaryTable').innerHTML = summaryHTML;
}

function renderChart() {
    const ctx = document.getElementById('abrilChart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (currentChart) {
        currentChart.destroy();
    }
    
    const sortedMonths = sortMonths(Object.keys(monthlySummary));
    
    const chartData = {
        labels: sortedMonths.map(m => m.toUpperCase()),
        datasets: [
            {
                label: 'Cerrados ELE',
                data: sortedMonths.map(m => monthlySummary[m].cerradosELE),
                backgroundColor: '#ff6b6b',
                borderColor: '#ff5252',
                borderWidth: 1
            },
            {
                label: 'Total gen ELE',
                data: sortedMonths.map(m => monthlySummary[m].totalELE),
                backgroundColor: '#4ecdc4',
                borderColor: '#26a69a',
                borderWidth: 1
            },
            {
                label: 'Cerrados ETN',
                data: sortedMonths.map(m => monthlySummary[m].cerradosETN),
                backgroundColor: '#45b7d1',
                borderColor: '#2196f3',
                borderWidth: 1
            },
            {
                label: 'Total gen ETN',
                data: sortedMonths.map(m => monthlySummary[m].totalETN),
                backgroundColor: '#f9ca24',
                borderColor: '#f39c12',
                borderWidth: 1
            }
        ]
    };
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'AVISOS CERRADOS - TODOS LOS MESES'
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...chartData.datasets.flatMap(d => d.data)) * 1.2
                }
            }
        }
    });
}

function renderChartFiltered(selectedMonth) {
    const ctx = document.getElementById('abrilChart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (currentChart) {
        currentChart.destroy();
    }
    
    const monthData = monthlySummary[selectedMonth];
    
    const chartData = {
        labels: [selectedMonth.toUpperCase()],
        datasets: [
            {
                label: 'Cerrados ELE',
                data: [monthData.cerradosELE],
                backgroundColor: '#ff6b6b',
                borderColor: '#ff5252',
                borderWidth: 1
            },
            {
                label: 'Total gen ELE',
                data: [monthData.totalELE],
                backgroundColor: '#4ecdc4',
                borderColor: '#26a69a',
                borderWidth: 1
            },
            {
                label: 'Cerrados ETN',
                data: [monthData.cerradosETN],
                backgroundColor: '#45b7d1',
                borderColor: '#2196f3',
                borderWidth: 1
            },
            {
                label: 'Total gen ETN',
                data: [monthData.totalETN],
                backgroundColor: '#f9ca24',
                borderColor: '#f39c12',
                borderWidth: 1
            }
        ]
    };
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `AVISOS CERRADOS - ${selectedMonth.toUpperCase()}`
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...chartData.datasets.flatMap(d => d.data)) * 1.2
                }
            }
        }
    });
}

function renderAvisosData() {
    // Procesar datos para contar avisos atrasados por sistema, semana y grupo
    const atrasadosPorSemana = {};
    
    currentData.forEach(row => {
        const semana = row['Semana'] || 'N/A';
        const sistema = row['Sistema'] || 'N/A';
        const grupo = row['Grupo planif.'] || 'N/A';
        const encargado = row['Encargado'] || 'N/A';
        const atrasado = parseInt(row['atrasados']) || 0;
        
        if (atrasado !== 1) return; // Solo contamos los atrasados (valor 1)
        
        if (!atrasadosPorSemana[semana]) {
            atrasadosPorSemana[semana] = {
                grupo: grupo,
                encargados: new Set(), // Para almacenar encargados únicos por semana
                sistemas: {}
            };
        }
        
        // Agregar encargado a la lista de encargados de la semana
        if (encargado && encargado !== 'N/A') {
            atrasadosPorSemana[semana].encargados.add(encargado);
        }
        
        if (!atrasadosPorSemana[semana].sistemas[sistema]) {
            atrasadosPorSemana[semana].sistemas[sistema] = {
                count: 0,
                encargados: new Set() // Para almacenar encargados únicos por sistema
            };
        }
        
        atrasadosPorSemana[semana].sistemas[sistema].count += 1;
        
        // Agregar encargado específico del sistema
        if (encargado && encargado !== 'N/A') {
            atrasadosPorSemana[semana].sistemas[sistema].encargados.add(encargado);
        }
    });
    
    // Obtener todos los sistemas únicos para las columnas
    const todosSistemas = new Set();
    Object.values(atrasadosPorSemana).forEach(semanaData => {
        Object.keys(semanaData.sistemas).forEach(sistema => {
            todosSistemas.add(sistema);
        });
    });
    
    // Ordenar los sistemas (H01, H02, etc.)
    const sistemasOrdenados = Array.from(todosSistemas).sort((a, b) => {
        const numA = parseInt(a.replace(/^\D+/g, ''));
        const numB = parseInt(b.replace(/^\D+/g, ''));
        return numA - numB;
    });
    
    // Generar HTML para la tabla
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Semana</th>
                    <th>Grupo</th>
                    ${sistemasOrdenados.map(sis => `<th>${sis}</th>`).join('')}
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Agregar filas para cada semana
    Object.keys(atrasadosPorSemana).sort().forEach(semana => {
        const semanaData = atrasadosPorSemana[semana];
        let totalSemana = 0;
        
        // Calcular total para la semana
        Object.values(semanaData.sistemas).forEach(sistemaData => {
            totalSemana += sistemaData.count;
        });
        
        tableHTML += `
            <tr>
                <td>${semana}</td>
                <td>${semanaData.grupo}</td>
                ${sistemasOrdenados.map(sis => {
                    const sistemaData = semanaData.sistemas[sis];
                    const count = sistemaData ? sistemaData.count : 0;
                    const encargadosSistema = sistemaData ? Array.from(sistemaData.encargados).join(', ') : '';
                    
                    // Si hay encargados específicos para este sistema, mostrarlos en el título
                    const title = encargadosSistema ? `Encargados: ${encargadosSistema}` : '';
                    
                    return `<td title="${title}">${count}</td>`;
                }).join('')}
                <td>${totalSemana}</td>
            </tr>
        `;
    });
    
    // Agregar fila de totales
    const totalesPorSistema = {};
    let granTotal = 0;
    
    sistemasOrdenados.forEach(sis => {
        totalesPorSistema[sis] = 0;
    });
    
    Object.values(atrasadosPorSemana).forEach(semanaData => {
        Object.entries(semanaData.sistemas).forEach(([sis, sistemaData]) => {
            totalesPorSistema[sis] += sistemaData.count;
            granTotal += sistemaData.count;
        });
    });
    
    tableHTML += `
            <tr style="font-weight: bold; background: #f0f0f0;">
                <td>Total general</td>
                <td></td>
                ${sistemasOrdenados.map(sis => `<td>${totalesPorSistema[sis]}</td>`).join('')}
                <td>${granTotal}</td>
            </tr>
        </tbody>
        </table>
    `;
    
    document.getElementById('avisosTable').innerHTML = tableHTML;
}

function applyRawDataFilters() {
    const groupFilter = document.getElementById('rawGroupFilter').value;
    const statusFilter = document.getElementById('rawStatusFilter').value;
    const monthFilter = document.getElementById('rawMonthFilter')?.value || 'todos';
    const weekFilter = document.getElementById('rawWeekFilter')?.value || 'todos';

    const rows = document.querySelectorAll('.raw-data-table tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        let shouldShow = true;
        const cells = row.cells;
        
        // Aplicar filtros
        if (groupFilter !== 'todos') {
            const groupCell = Array.from(cells).find(cell => 
                cell.getAttribute('data-column') === 'Grupo planif.');
            if (!groupCell || groupCell.textContent !== groupFilter) {
                shouldShow = false;
            }
        }

        if (statusFilter !== 'todos') {
            const statusCell = Array.from(cells).find(cell => 
                cell.getAttribute('data-column') === 'Status sistema');
            if (!statusCell) {
                shouldShow = false;
            } else {
                const status = statusCell.textContent.toUpperCase().trim();
                let statusType = '';
                if (status.includes('MECE')) {
                    if (status.includes('MIMP')) statusType = 'MECE MIMP';
                    else if (status.includes('ORAS')) statusType = 'MECE ORAS';
                    else statusType = 'MECE';
                } else if (status.includes('METR')) {
                    if (status.includes('MIMP')) statusType = 'METR MIMP';
                    else if (status.includes('ORAS')) statusType = 'METR ORAS';
                    else statusType = 'METR';
                }
                if (statusType !== statusFilter) {
                    shouldShow = false;
                }
            }
        }

        if (monthFilter !== 'todos' && fileType === 'abril') {
            const dateCell = Array.from(cells).find(cell => 
                cell.getAttribute('data-column') === 'Fecha de aviso');
            if (!dateCell) {
                shouldShow = false;
            } else {
                const cellText = dateCell.textContent || '';
                const lowerCellText = String(cellText).toLowerCase();
                if (!lowerCellText.includes(monthFilter)) {
                    shouldShow = false;
                }
            }
        }

        if (weekFilter !== 'todos' && fileType === 'avisos') {
            const weekCell = Array.from(cells).find(cell => 
                cell.getAttribute('data-column') === 'Semana');
            if (!weekCell || weekCell.textContent !== weekFilter) {
                shouldShow = false;
            }
        }

        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });

    // Actualizar contador de registros visibles
    const infoDiv = document.querySelector('.raw-data-info');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <span>Registros visibles: <strong>${visibleCount}</strong> de ${currentData.length}</span>
            <span>Columnas: <strong>${document.querySelectorAll('.raw-data-table th:not([style*="display: none"])').length}</strong></span>
        `;
    }
}

function resetRawDataFilters() {
    if (document.getElementById('rawGroupFilter')) {
        document.getElementById('rawGroupFilter').value = 'todos';
    }
    if (document.getElementById('rawStatusFilter')) {
        document.getElementById('rawStatusFilter').value = 'todos';
    }
    if (document.getElementById('rawMonthFilter')) {
        document.getElementById('rawMonthFilter').value = 'todos';
    }
    if (document.getElementById('rawWeekFilter')) {
        document.getElementById('rawWeekFilter').value = 'todos';
    }
    applyRawDataFilters();
}

function toggleColumnVisibilityCheckboxes() {
    const checkboxes = document.querySelectorAll('.column-checkbox');
    const table = document.querySelector('.raw-data-table');
    
    if (!table) return;
    
    checkboxes.forEach(checkbox => {
        const columnName = checkbox.value;
        const columnIndex = Array.from(table.querySelectorAll('th')).findIndex(th => 
            th.getAttribute('data-column') === columnName
        );
        
        if (columnIndex !== -1) {
            // Ocultar/mostrar encabezados
            table.querySelectorAll(`th[data-column="${columnName}"]`).forEach(th => {
                th.style.display = checkbox.checked ? '' : 'none';
            });
            
            // Ocultar/mostrar celdas en cada fila
            table.querySelectorAll(`td[data-column="${columnName}"]`).forEach(td => {
                td.style.display = checkbox.checked ? '' : 'none';
            });
        }
    });
    
    // Actualizar contador de columnas visibles
    updateVisibleColumnsCount();
}

function updateVisibleColumnsCount() {
    const visibleColumns = document.querySelectorAll('.raw-data-table th:not([style*="display: none"])').length;
    const infoDiv = document.querySelector('.raw-data-info');
    if (infoDiv) {
        const visibleCount = document.querySelectorAll('.raw-data-table tbody tr:not([style*="display: none"])').length;
        const totalCount = currentData.length;
        infoDiv.innerHTML = `
            <span>Registros visibles: <strong>${visibleCount}</strong> de ${totalCount}</span>
            <span>Columnas visibles: <strong>${visibleColumns}</strong></span>
        `;
    }
}

function organizeAvisosByWeek() {
    allWeeksData = {};
    
    currentData.forEach(row => {
        const semana = row['Semana'] || 'N/A';
        
        if (!allWeeksData[semana]) {
            allWeeksData[semana] = [];
        }
        
        allWeeksData[semana].push(row);
    });
    
    // Actualizar los selectores de filtros
    const weekFilter = document.getElementById('avisosWeekFilter');
    const encargadoFilter = document.getElementById('avisosEncargadoFilter');
    
    weekFilter.innerHTML = '<option value="todos">Todas las semanas</option>';
    encargadoFilter.innerHTML = '<option value="todos">Todos los encargados</option>';
    
    // Llenar filtro de semanas
    const sortedWeeks = Object.keys(allWeeksData).sort((a, b) => parseInt(a) - parseInt(b));
    sortedWeeks.forEach(week => {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = `Semana ${week}`;
        weekFilter.appendChild(option);
    });
    
    // Llenar filtro de encargados
    const encargados = [...new Set(currentData.map(row => row['Encargado']).filter(e => e && e !== 'N/A'))];
    encargados.sort().forEach(encargado => {
        const option = document.createElement('option');
        option.value = encargado;
        option.textContent = encargado;
        encargadoFilter.appendChild(option);
    });
}

function calculateWeeklySummaries() {
    weeklySummary = {};
    encargadosSummary = {};
    
    Object.keys(allWeeksData).forEach(week => {
        const data = allWeeksData[week];
        
        // Resumen por grupos (similar a abril)
        const grupos = {
            'ELE': { total: 0, atrasados: 0 },
            'ETN': { total: 0, atrasados: 0 }
        };
        
        // Resumen por encargados
        const encargadosWeek = {};
        
        data.forEach(row => {
            const grupo = row['Grupo planif.'] || 'N/A';
            const encargado = row['Encargado'] || 'N/A';
            const atrasado = parseInt(row['atrasados']) || 0;
            
            // Contar por grupos
            if (grupos[grupo]) {
                grupos[grupo].total++;
                if (atrasado === 1) {
                    grupos[grupo].atrasados++;
                }
            }
            
            // Contar por encargados
            if (encargado !== 'N/A') {
                if (!encargadosWeek[encargado]) {
                    encargadosWeek[encargado] = { total: 0, atrasados: 0 };
                }
                encargadosWeek[encargado].total++;
                if (atrasado === 1) {
                    encargadosWeek[encargado].atrasados++;
                }
                
                // Resumen global por encargados
                if (!encargadosSummary[encargado]) {
                    encargadosSummary[encargado] = { total: 0, atrasados: 0 };
                }
                encargadosSummary[encargado].total++;
                if (atrasado === 1) {
                    encargadosSummary[encargado].atrasados++;
                }
            }
        });
        
        // Calcular porcentajes
        const totalELE = grupos.ELE.total;
        const totalETN = grupos.ETN.total;
        const atrasadosELE = grupos.ELE.atrasados;
        const atrasadosETN = grupos.ETN.atrasados;
        
        const porcentajeELE = totalELE > 0 ? ((atrasadosELE / totalELE) * 100).toFixed(1) : '0.0';
        const porcentajeETN = totalETN > 0 ? ((atrasadosETN / totalETN) * 100).toFixed(1) : '0.0';
        const totalGeneral = totalELE + totalETN;
        const totalPorcentaje = totalGeneral > 0 ? (((atrasadosELE + atrasadosETN) / totalGeneral) * 100).toFixed(1) : '0.0';
        
        weeklySummary[week] = {
            grupos,
            totalELE,
            totalETN,
            atrasadosELE,
            atrasadosETN,
            porcentajeELE,
            porcentajeETN,
            totalPorcentaje,
            encargados: encargadosWeek
        };
    });
}

function renderAvisosPlanificacionTable() {
    const selectedWeek = document.getElementById('avisosWeekFilter').value;
    const selectedEncargado = document.getElementById('avisosEncargadoFilter').value;
    
    let dataToProcess = currentData;
    
    // Aplicar filtros
    if (selectedWeek !== 'todos') {
        dataToProcess = dataToProcess.filter(row => row['Semana'] == selectedWeek);
    }
    
    if (selectedEncargado !== 'todos') {
        dataToProcess = dataToProcess.filter(row => row['Encargado'] === selectedEncargado);
    }
    
    // Calcular totales por grupo
    const grupos = {
        'ELE': { total: 0, atrasados: 0 },
        'ETN': { total: 0, atrasados: 0 }
    };
    
    dataToProcess.forEach(row => {
        const grupo = row['Grupo planif.'] || 'N/A';
        const atrasado = parseInt(row['atrasados']) || 0;
        
        if (grupos[grupo]) {
            grupos[grupo].total++;
            if (atrasado === 1) {
                grupos[grupo].atrasados++;
            }
        }
    });
    
    // Calcular porcentajes
    const totalELE = grupos.ELE.total;
    const totalETN = grupos.ETN.total;
    const atrasadosELE = grupos.ELE.atrasados;
    const atrasadosETN = grupos.ETN.atrasados;
    const totalGeneral = totalELE + totalETN;
    
    const porcentajeELE = totalELE > 0 ? ((atrasadosELE / totalELE) * 100).toFixed(1) : '0.0';
    const porcentajeETN = totalETN > 0 ? ((atrasadosETN / totalETN) * 100).toFixed(1) : '0.0';
    const totalPorcentaje = totalGeneral > 0 ? (((atrasadosELE + atrasadosETN) / totalGeneral) * 100).toFixed(1) : '0.0';
    
    let displayTitle = 'Todas las semanas';
    if (selectedWeek !== 'todos') {
        displayTitle = `Semana ${selectedWeek}`;
    }
    if (selectedEncargado !== 'todos') {
        displayTitle += ` - ${selectedEncargado}`;
    }
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Grupo plan</th>
                    <th>Período</th>
                    <th>Total avisos</th>
                    <th>Atrasados</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>ELE</td>
                    <td>${displayTitle}</td>
                    <td>${totalELE}</td>
                    <td class="status-metr">${atrasadosELE}</td>
                </tr>
                <tr>
                    <td>ETN</td>
                    <td>${displayTitle}</td>
                    <td>${totalETN}</td>
                    <td class="status-metr">${atrasadosETN}</td>
                </tr>
                <tr style="font-weight: bold; background: #f0f0f0;">
                    <td>Total general</td>
                    <td></td>
                    <td>${totalGeneral}</td>
                    <td>${atrasadosELE + atrasadosETN}</td>
                </tr>
            </tbody>
        </table>
    `;
    
    document.getElementById('avisosPlanificacionTable').innerHTML = tableHTML;
}

function renderAvisosChart() {
    const ctx = document.getElementById('avisosChart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (currentAvisosChart) {
        currentAvisosChart.destroy();
    }
    
    const encargados = Object.keys(encargadosSummary).sort();
    
    const chartData = {
        labels: encargados,
        datasets: [
            {
                label: 'Total avisos',
                data: encargados.map(enc => encargadosSummary[enc].total),
                backgroundColor: '#4ecdc4',
                borderColor: '#26a69a',
                borderWidth: 1
            },
            {
                label: 'Atrasados',
                data: encargados.map(enc => encargadosSummary[enc].atrasados),
                backgroundColor: '#ff6b6b',
                borderColor: '#ff5252',
                borderWidth: 1
            }
        ]
    };
    
    currentAvisosChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'AVISOS ATRASADOS POR ENCARGADO'
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...chartData.datasets.flatMap(d => d.data)) * 1.2
                }
            }
        }
    });
}

function filterAvisosByWeek() {
    renderAvisosPlanificacionTable();
    renderAvisosData();
}
