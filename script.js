<<<<<<< HEAD
let isAscending = true;
let selectedMake = null;
let averageConsumption = [];  // Para almacenar los datos globales

d3.csv("FuelConsumption.csv").then(data => {
    let consumptionByMake = d3.group(data, d => d.MAKE);
    averageConsumption = Array.from(consumptionByMake, ([make, values]) => {
        let total = d3.sum(values, d => +d['FUEL CONSUMPTION']);
        let count = values.length;
        return { make, average: total / count };
    });

    sortData(averageConsumption);

    drawBarChart(averageConsumption, data);
});

function sortData(data) {
    if (isAscending) {
        data.sort((a, b) => a.average - b.average);
    } else {
        data.sort((a, b) => b.average - a.average);
    }
}

function drawBarChart(data, fullData) {
    d3.select("#left svg").remove();  // Limpiar gráfico anterior si existe

    const margin = { top: 20, right: 20, bottom: 10, left: 10 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#left")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.average)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(data.map(d => d.make))
        .range([height, 0])
        .padding(0.1);

    // Título del gráfico
    svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", 1 - (margin.top / 20))
    .attr("text-anchor", "middle")  
    .style("font-size", "16px") 
    .style("text-decoration", "underline")  
    .text("Consumo promedio (L/100km) de combustible por marca");

    // Barras
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => yScale(d.make))
        .attr("width", d => xScale(d.average))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => d.make === selectedMake ? "orange" : "steelblue")
        .transition()
        .duration(1000)
        .attr("width", d => xScale(d.average));

    // Etiquetas de marca
    svg.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", 0)
        .attr("y", d => yScale(d.make) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => d.make);

    // Etiquetas de valor
    svg.selectAll(".value-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => xScale(d.average) + -30)
        .attr("y", d => yScale(d.make) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${d3.format(".2f")(d.average)}`);

    // Evento click en las barras
    svg.selectAll("rect")
        .on("click", function(event, d) {
            // Quitar borde de todas las barras
            svg.selectAll("rect")
                .attr("stroke", "none")
                .attr("stroke-width", 2);

            // Resaltar la barra seleccionada
            d3.select(this)
                .attr("stroke", "orange")
                .attr("stroke-width", 4);

            selectedMake = d.make;
            drawFuelChart(selectedMake, fullData);
        });
}

function drawFuelChart(make, fullData) {
    // Limpiar elementos antiguos
    d3.select("#right svg").remove();
    d3.select("#selectedMake").remove();
    d3.select("#carList").remove();
    d3.select("#sortButton").remove();
    d3.select("#right h4").remove();

    let selectedData = fullData.filter(item => item.MAKE === make);

    // Nombre de la marca seleccionada
    d3.select("#right")
        .append("h3")
        .attr("id", "selectedMake")
        .text(make)
        .style("text-align", "center");

    // Título del gráfico de combustibles
    d3.select("#right")
        .append("h4")
        .text("Distribución de tipos de combustible");

    // Botón de ordenamiento
    const sortButton = d3.select("#right")
        .append("button")
        .attr("id", "sortButton")
        .text("Ordenar por consumo")
        .on("click", function() {
            isAscending = !isAscending; // Cambiar el estado del ordenamiento
            drawFuelChart(make, fullData); // Redibujar el gráfico con el nuevo orden
        });

    let fuelCount = {
        'X': 0,
        'Z': 0,
        'O': 0
    };

    selectedData.forEach(item => {
        if (item.FUEL === 'X') fuelCount['X']++;
        else if (item.FUEL === 'Z') fuelCount['Z']++;
        else fuelCount['O']++;
    });

    let total = Object.values(fuelCount).reduce((acc, val) => acc + val, 0);

    if (total === 0) {
        console.error("No hay datos disponibles para la marca seleccionada.");
        return;
    }

    let fuelData = Object.keys(fuelCount).map(type => ({
        type,
        count: fuelCount[type],
        percentage: ((fuelCount[type] || 0) / total) * 100
    })).sort((a, b) => b.count - a.count); // Ordenar por cantidad de combustible

    // Crear gráfico de combustibles
    const marginFuel = { top: 30, right: 20, bottom: 50, left: 60 };
    const widthFuel = 400 - marginFuel.left - marginFuel.right;
    const heightFuel = 300 - marginFuel.top - marginFuel.bottom;

    const svgFuel = d3.select("#right")
        .append("svg")
        .attr("width", widthFuel + marginFuel.left + marginFuel.right)
        .attr("height", heightFuel + marginFuel.top + marginFuel.bottom)
        .append("g")
        .attr("transform", `translate(${marginFuel.left},${marginFuel.top})`);

    const xScaleFuel = d3.scaleBand()
        .domain(fuelData.map(d => d.type))
        .range([0, widthFuel])
        .padding(0.2);

    const yScaleFuel = d3.scaleLinear()
        .domain([0, d3.max(fuelData, d => d.count)])
        .range([heightFuel, 0]);

    // Barras de combustible
    const bars = svgFuel.selectAll("rect")
        .data(fuelData)
        .enter()
        .append("rect")
        .attr("x", d => xScaleFuel(d.type))
        .attr("y", d => yScaleFuel(d.count))
        .attr("width", xScaleFuel.bandwidth())
        .attr("height", d => heightFuel - yScaleFuel(d.count))
        .attr("fill", (d, i) => ['blue', 'green', 'orange'][i])
        .transition()
        .duration(1000)
        .attr("height", d => heightFuel - yScaleFuel(d.count));

    // Etiquetas de porcentaje
    svgFuel.selectAll("text.percentage")
        .data(fuelData)
        .enter()
        .append("text")
        .attr("class", "percentage")
        .attr("x", d => xScaleFuel(d.type) + xScaleFuel.bandwidth() / 2)
        .attr("y", d => yScaleFuel(d.count) - 5)
        .attr("dy", ".35em")
        .text(d => `${d3.format(".2f")(d.percentage)}%`)
        .attr("text-anchor", "middle");

    // Leyenda dentro del gráfico
    svgFuel.selectAll("text.legend")
        .data(fuelData)
        .enter()
        .append("text")
        .attr("class", "legend")
        .attr("x", d => xScaleFuel(d.type) + xScaleFuel.bandwidth() / 2)
        .attr("y", heightFuel + 30) // Posición debajo del eje x
        .attr("dy", ".71em")
        .text(d => {
            switch (d.type) {
                case 'X': return 'Gasolina';
                case 'Z': return 'Diesel';
                case 'O': return 'Otro';
            }
        })
        .attr("text-anchor", "middle")
        .attr("fill", "black");

    // Lista de coches de mayor a menor consumo
    const sortedCars = selectedData.sort((a, b) => {
        if (isAscending) {
            return a['FUEL CONSUMPTION'] - b['FUEL CONSUMPTION'];
        } else {
            return b['FUEL CONSUMPTION'] - a['FUEL CONSUMPTION'];
        }
    }).slice(0, 5); // Tomar los 5 coches de mayor consumo

    d3.select("#right")
        .append("div")
        .attr("id", "carList")
        .selectAll("p")
        .data(sortedCars)
        .enter()
        .append("p")
        .text(d => `${d.MODEL} - ${d3.format(".2f")(d['FUEL CONSUMPTION'])} L/100km`);
}
=======
console.log("¡Hola gente!")
>>>>>>> 69dd1307f9dc464cea3579be541dcc623d39c4aa
