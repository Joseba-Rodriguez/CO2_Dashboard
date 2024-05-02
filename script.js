let isAscending = true; // true cuando la ordenacion es ascendente en el consumo de gasolina; false en caso contrario
let selectedMake = null; // Almacena el valor de la marca que el usuario selecciona. Inicialmente null porque no esta seleccionada ninguna por defecto
let averageConsumption = [];  // Para almacenar los datos globales de consumo medio de combustible

/*
    1 - Carga de los datos
    2 - Agrupacion de los datos por la marca del vehiculo
    3 - Calculo del consumo pormedio de combustible para cada marca
*/
d3.csv("FuelConsumption.csv").then(data => {
    let consumptionByMake = d3.group(data, d => d.MAKE);
    
    //Se convierte el map en array para que nos sea mas facil trabajar con los datos
    averageConsumption = Array.from(consumptionByMake, ([make, values]) => {
        let total = d3.sum(values, d => +d['FUEL CONSUMPTION']);
        let count = values.length;
        return { make, average: total / count };
    });

    sortData(averageConsumption); // Ordenacion de los datos por consumo promedio, de forma ascendente o descendente

    drawBarChart(averageConsumption, data); // Se muestra el grafico de barras de consumos promedios
});

// Ordena los datos de consumo recibidos en función de si se selecciona orden ascendente o descendente
// Por defecto, si el usuario no indica lo contrario, la ordenacion es ascendente
function sortData(data) {
    if (isAscending) {
        data.sort((a, b) => a.average - b.average);
    } else {
        data.sort((a, b) => b.average - a.average);
    }
}

// Dibuja el grafico de barras horizontales para visualizar el consumo promedio de combustible para cada marca
// Parametro data: array de objetos con las marcas de vehiculos y sus consumos promedio
// Parametro fullData: conjunto de datos sin procesar, directamente del csv
function drawBarChart(data, fullData) {
    d3.select("#left svg").remove();  // Limpiar gráfico anterior si existe y asi no se superponen

    // Definimos un espacio para el grafico, con margenes, ancho y alto
    const margin = { top: 20, right: 20, bottom: 10, left: 10 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const title = d3.select("#left")
                    .append("h2")
                    .style("text-align", "center")
                    .text("Consumo promedio (L/100km) de combustible por marca")

    const svg = d3.select("#left")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g") // Con este elemento hacemos que se ajuste a los margenes anteriores 
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escala lineal para el eje x. Mapea el consumo promedio de combustible al ancho del grafico.
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.average)])
        .range([0, width]);

    // Escala de bandas para el eje y. Asigna cada marca de vehiculo a una posicion vertical y un pequeño relleno entre barras
    const yScale = d3.scaleBand()
        .domain(data.map(d => d.make))
        .range([height, 0])
        .padding(0.1);

    // Título del gráfico, centrado arriba del area del grafico
    /*
    svg.append("text")
    .attr("x", (width / 2))             
    .attr("y", 1 - (margin.top / 20))
    .attr("text-anchor", "middle")  
    .style("font-size", "16px") 
    .style("text-decoration", "underline")
    .text("Consumo promedio (L/100km) de combustible por marca");
    */

    // Creacion de barras representando marcas de vehiculo.
    // Ponemos un color a la marca que seleccione el usuario
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => yScale(d.make))
        .attr("width", d => xScale(d.average))
        .attr("height", yScale.bandwidth())
        .attr("margin", "5px")
        .attr("fill", d => d.make === selectedMake ? "brown" : "steelblue")
    //    .transition()
    //    .duration(1000)
    //    .attr("width", d => xScale(d.average));

        .on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            tooltip.style("display", "block")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`)
                    .html(`<img src="${Listado_logos(d.make)}" alt="${d.make} logo" style="width:100px;">`);
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("display", "none");
        });

        function Listado_logos(make) {
            // Listado de logos dependiendo de la marca
            const logos = {
                "FERRARI": "/logos/Ferrari.jpeg", "LAND ROVER": "/logos/Land_rover.png", "DODGE": "/logos/Dodge.jpeg",
                "GMC": "/logos/GMC.png", "CADILLAC": "/logos/Cadillac.webp", "JEEP": "/logos/Jeep.png",
                "LINCOLN": "/logos/Lincoln.webp", "FORD": "/logos/Ford.png", "ISUZU": "/logos/Isuzu.webp",
                "JAGUAR": "/logos/Jaguar.png", "CHEVROLET": "/logos/Chevrolet.png", "PORSCHE": "/logos/Porsche.png",
                "PLYMOUTH": "/logos/Plymouth.png", "NISSAN": "/logos/Nissan.png", "LEXUS": "/logos/Lexus.png",
                "BMW": "/logos/Bmw.png", "MERCEDES-BENZ": "/logos/Mercedes.png", "BUICK": "/logos/Buick.png",
                "AUDI": "/logos/Audi.png", "VOLVO": "/logos/Volvo.png", "CHRYSLER": "/logos/Chrysler.png",
                "SAAB": "/logos/Saab.png", "INFINITI": "/logos/Infiniti.png", "OLDSMOBILE": "/logos/Oldsmobile.png",
                "MAZDA": "/logos/Mazda.png", "TOYOTA": "/logos/Toyota.png", "PONTIAC": "/logos/Pontiac.png",
                "ACURA": "/logos/Acura.png", "KIA": "/logos/Kia.png", "SUBARU": "/logos/Subaru.png",
                "DAEWOO": "/logos/Daewoo.png", "VOLKSWAGEN": "/logos/Volkswagen.png", "HYUNDAI": "/logos/Hyunday.png",
                "HONDA": "/logos/Honda.png", "SATURN": "/logos/Saturn.png", "SUZUKI": "/logos/Suzuki.png"     };
            return logos[make] || ''; // Devuelve el logo o cadena vacía si no se encuentra
        }



    // Etiquetas de marca para cada barra
    svg.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", 0)
        .attr("y", d => yScale(d.make) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => d.make);

    // Etiquetas de valor de consumo promedio para cada barra
    svg.selectAll(".value-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => xScale(d.average) + -40)
        .attr("y", d => yScale(d.make) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${d3.format(".2f")(d.average)}`);

    // Evento click en las barras para permitir interaccion
    // Cuando se hace click, se muestra el otro grafico con detalle sobre el tipo de combustible para la marca seleccionada
    svg.selectAll("rect")
        .on("click", function(event, d) {
            // Quitar borde de todas las barras
            svg.selectAll("rect")
                .attr("stroke", "none")
                .attr("stroke-width", 2);

            // Resaltar la barra seleccionada
            d3.select(this)
                .attr("stroke", "brown")
                .attr("stroke-width", 4);

            selectedMake = d.make;
            drawFuelChart(selectedMake, fullData);
        });
}

// Muestra los tipos de combustible usados por los modelos de la marca seleccionada
function drawFuelChart(make, fullData) {
    
    // Se limpian elementos antiguos para que no se superpongan 
    d3.select("#right svg").remove();
    d3.select("#selectedMake").remove();
    d3.select("h2").remove();
    d3.select("#carList").remove();
    d3.select("#sortButton").remove();
    d3.select("#btn").remove();
    d3.select("#right h4").remove();

    // Filtramos por la marca seleccionada
    let selectedData = fullData.filter(item => item.MAKE === make);

    // Mostramos el nombre de la marca seleccionada
    d3.select("#right")
        .append("h1")
        .attr("id", "selectedMake")
        .text(make)
        .style("text-align", "center")
        .style("color", "brown");

    // Título del gráfico de combustibles
    d3.select("#right")
        .append("h2")
        .style("text-align", "center")
        .text("Distribución de tipos de combustible");

    // Botón de ordenamiento para cambiar el orden de visualizacion (ascendente o descendente)
    const sortButton = d3.select("#right")
        .append("button")
        .attr("id", "sortButton")
        .attr("id", "btn")
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

    // Contamos cuantos modelos usan cada tipo de combustible
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

    // Creamos un nuevo espacio para dibujar el grafico de tipos de combustible por marca
    const svgFuel = d3.select("#right")
        .append("svg")
        .attr("width", widthFuel + marginFuel.left + marginFuel.right)
        .attr("height", heightFuel + marginFuel.top + marginFuel.bottom)
        .append("g")
        .attr("transform", `translate(${marginFuel.left},${marginFuel.top})`);

    // Escalas para los ejes de combustibles
    const xScaleFuel = d3.scaleBand()
        .domain(fuelData.map(d => d.type))
        .range([0, widthFuel])
        .padding(0.2);

    const yScaleFuel = d3.scaleLinear()
        .domain([0, d3.max(fuelData, d => d.count)])
        .range([heightFuel, 0]);

    // Barras de combustible  // TOOLTIP
  
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
        .attr("height", d => heightFuel - yScaleFuel(d.count))
    
        
    // Etiquetas de porcentaje para los combustibles
    svgFuel.selectAll("text.percentage")
        .data(fuelData)
        .enter()
        .append("text")
        .attr("class", "percentage")
        .attr("x", d => xScaleFuel(d.type) + xScaleFuel.bandwidth() / 2)
        .attr("y", d => yScaleFuel(d.count) - 15)
        .attr("dy", ".35em")
        .text(d => `${d3.format(".2f")(d.percentage)}%`)
        .attr("class", "fuel-type-text")
        .attr("text-anchor", "middle");

    // Leyenda dentro del gráfico para distinguir cada tipo de combustible
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
        .attr("class", "fuel-type-text")
        .attr("fill", "black");

    // Lista de coches de mayor a menor consumo
    const sortedCars = selectedData.sort((a, b) => {
        if (isAscending) {
            return a['FUEL CONSUMPTION'] - b['FUEL CONSUMPTION'];
        } else {
            return b['FUEL CONSUMPTION'] - a['FUEL CONSUMPTION'];
        }
    }).slice(0, 5); // Tomar los 5 coches de mayor consumo

    // Mostramos el consumo ordenado de los coches para la marca seleccionada
    d3.select("#right")
        .append("div")
        .attr("id", "carList")
        .selectAll("p")
        .data(sortedCars)
        .enter()
        .append("p")
        .style("padding-left", "15px")
        .text(d => `${d.MODEL} - consumo de  ${d3.format(".2f")(d['FUEL CONSUMPTION'])} L/100km`);
}

