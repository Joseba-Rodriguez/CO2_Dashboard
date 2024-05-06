var isAscending = true; // true cuando la ordenacion es ascendente en el consumo de gasolina; false en caso contrario
var selectedMake = null; // Almacena el valor de la marca que el usuario selecciona. Inicialmente null porque no esta seleccionada ninguna por defecto
var averageConsumption = [];  // Para almacenar los datos globales de consumo medio de combustible

/*
    1 - Carga de los datos
    2 - Agrupacion de los datos por la marca del vehiculo
    3 - Calculo del consumo pormedio de combustible para cada marca
*/
d3.csv("FuelConsumption.csv").then(data => {
    let consumptionByMake = d3.group(data, d => d.MAKE); // Carga de datos del archivo CSV "FuelConsumption.csv" y luego se agrupa por la propiedad "MAKE", que representa la marca de los vehiculos

    //Se convierte el map en array para que nos sea mas facil trabajar con los datos
    averageConsumption = Array.from(consumptionByMake, ([make, values]) => {
        let total = d3.sum(values, d => +d['FUEL CONSUMPTION']); // Calcula el consumo promedio de combustible para cada marca a partir de los datos agrupados previamente por marca
        let count = values.length;
        return { make, average: total / count }; // Para cada marca, se suma el consumo de combustible de todos los vehiculos y se divide entre el numero total de vehiculos de esa marca
    });

    sortData(averageConsumption); // Ordenacion de los datos por consumo promedio, de forma ascendente o descendente

    drawBarChart(averageConsumption, data); // Se muestra el grafico de barras de consumos promedios
});

// Ordena los datos de consumo recibidos en funcion de si se selecciona orden ascendente o descendente
// Por defecto, si el usuario no indica lo contrario, la ordenacion es ascendente
function sortData(data) {
    if (isAscending) { 
        data.sort((a, b) => a.average - b.average); //Los datos se ordenan de forma ascendente según el consumo promedio
    } else { 
        data.sort((a, b) => b.average - a.average); //Los datos se ordenan de forma descendente por el consumo promedio
    }
}

// Dibuja el grafico de barras horizontales para visualizar el consumo promedio de combustible para cada marca
// Parametro data: array de objetos con las marcas de vehiculos y sus consumos promedio
// Parametro fullData: conjunto de datos sin procesar, directamente del csv
function drawBarChart(data, fullData) {

    d3.select("#left svg").remove();  // Limpiar gráfico anterior si existe y asi no se superponen

    // Definimos un espacio para el grafico, con margenes, ancho y alto
    const margin = { top: 20, right: 20, bottom: 10, left: 10 }; // Define margenes para el area del grafico
    const width = 800 - margin.left - margin.right; // Calcula el ancho del area del grafico restando los margenes izquierdo y derecho del ancho total disponible.
    const height = 600 - margin.top - margin.bottom; // Calcula la altura del área del grafico restando los margenes superior e inferior de la altura total disponible.

    const title = d3.select("#left") // Selecciona el elemento HTML con el ID "left"(grafica de la izquierda)
        .append("h2") // Agrega un elemento h2 al elemento HTML con el ID "left"
        .attr("id", "left-graph-title")
        .style("text-align", "center") // Establece la alineacion centrada del texto
        .text("Consumo promedio (L/100km) de combustible por marca") // Titulo de la grafica izquierda

    const svg = d3.select("#left") 
        .append("svg") // Agrega un elemento SVG para dibujar la grafica izquierda dentro y poder trabajar sin preocuparnos de la resolucion
        .attr("width", width + margin.left + margin.right) // Establece el ancho del elemento SVG para que coincida con el ancho total del area del grafico, incluyendo los margenes izquierdo y derecho
        .attr("height", height + margin.top + margin.bottom) // Establece la altura del elemento SVG para que coincida con la altura total del tamaño del grafico, incluyendo los márgenes superior e inferior
        .append("g") // Añadimos un grupo para ajustar los elementos
        .attr("transform", `translate(${margin.left},${margin.top})`); // Establece la ubicacion del elemento SVG para que coincida con los margenes del grafico

    // Escala lineal para el eje x. Mapea el consumo promedio de combustible al ancho del grafico.
    const xScale = d3.scaleLinear() 
        .domain([0, d3.max(data, d => d.average)]) // Dominio de la escala (desde 0 hasta el valor máximo del consumo promedio)
        .range([0, width]); // Define el rango de la escala (va desde 0 hasta el ancho total del área del gráfico, asegurando que datos se mapeen correctamente en eje x en el espacio disponible)

    // Escala de bandas para el eje y. Asigna cada marca de vehiculo a una posicion vertical y un pequeño relleno entre barras
    const yScale = d3.scaleBand() 
        .domain(data.map(d => d.make)) // Dominio de la escala de bandas como un array de las marcas de vehículos, garantizando que cada marca tenga una banda discreta en el eje y del gráfico
        .range([height, 0]) //Define el rango de la escala de bandas (desde la parte superior hasta la parte inferior)
        .padding(0.1); // Espacio entre las bandas en el eje y (0.1)

    // Creacion de barras representando marcas de vehiculo.
    // Ponemos un color a la marca que seleccione el usuario
    svg.selectAll("rect") // Selecciona todos los elementos <rect> dentro del elemento SVG actual
        .data(data) // Asigna los datos de entrada al elemento <rect>
        .enter() // Devuelve una seleccion de los elementos de datos que no tienen un elemento coincidente en el DOM
        .append("rect") // Agrega un nuevo elemento <rect> para cada elemento de datos que no tiene una correspondencia en el DOM
        .attr("x", 0) // Establece la posicion x de cada rectángulo en 0, alineandolos en el borde izquierdo del area del grafico
        .attr("y", d => yScale(d.make)) // Establece la posicion y de cada rectangulo en funcion de la marca de vehiculo asociada con los datos, utilizando la escala de bandas yScale para ello
        .attr("width", d => xScale(d.average)) //Establece el ancho de cada rectangulo en funcion del consumo promedio de combustible asociado con los datos, utilizando la escala lineal xScale para ello
        .attr("height", yScale.bandwidth()) // Establece la altura de cada rectangulo utilizando el ancho de banda de la escala de bandas yScale, garantizando que cada rectangulo tenga la misma altura que las bandas en el eje y
        .attr("margin", "5px") // Establece un atributo de margen en 5 pixeles para cada rectangulo
        .attr("fill", d => d.make === selectedMake ? "brown" : "steelblue") // Establece el color de relleno de cada rectangulo en funcion de si la marca de vehiculo coincide con la marca seleccionada o no
        .on("mouseover", function (event, d) { // Cuando el raton se mueve sobre un rectangulo
            const tooltip = d3.select("#tooltip"); // Selecciona el elemento HTML con el ID "tooltip" utilizando la biblioteca D3.js
            tooltip.style("display", "block") // Muestra el elemento HTML con el ID "tooltip"
                .style("left", `${event.pageX + 10}px`) // Establece la ubicacion horizontal del elemento HTML con el ID "tooltip"
                .style("top", `${event.pageY + 10}px`) // Establece la ubicacion vertical del elemento HTML con el ID "tooltip"
                .html(`<img src="${Listado_logos(d.make)}" alt="${d.make} logo" style="width:100px;">`); // Establece el contenido HTML del elemento HTML con el ID "tooltip"
        })
        .on("mouseout", function () { // Cuando el raton se mueve fuera de un rectangulo
            d3.select("#tooltip").style("display", "none"); // Oculta el elemento HTML con el ID "tooltip"
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
            "HONDA": "/logos/Honda.png", "SATURN": "/logos/Saturn.png", "SUZUKI": "/logos/Suzuki.png"
        };
        return logos[make] || ''; // Devuelve el logo o una cadena vacia si no se encuentra
    }

    // Etiquetas de marca para cada barra
    svg.selectAll(".bar-label") // Selecciona todos los elementos con la clase "bar-label"
        .data(data) // Une los datos a los elementos seleccionados
        .join("text") // Agrega un elemento de texto para cada dato sin elemento asociado
        .attr("class", "bar-label") // Asigna la clase "bar-label" al elemento de texto
        .attr("x", 0) // Define la posicion horizontal inicial del texto en 0
        .attr("y", d => yScale(d.make) + yScale.bandwidth() / 2) // Calcula la posicion vertical del texto para centrarlo en la barra
        .attr("dy", ".35em") // Ajusta la posicion vertical del texto para centrarlo correctamente
        .text(d => d.make); // Establece el contenido del texto como el nombre de la marca

    // Etiquetas de valor de consumo promedio para cada barra
    svg.selectAll(".value-label") // Selecciona todos los elementos con la clase "value-label"
        .data(data) // Une los datos a los elementos seleccionados
        .enter() // Ingresa a los datos que no tienen elementos asociados
        .append("text") // Agrega un elemento de texto para cada dato sin elemento asociado
        .attr("class", "value-label") // Asigna la clase "value-label" al elemento de texto
        .attr("x", d => xScale(d.average) + -40) // Calcula la posicion horizontal del texto para colocarlo a la izquierda de la barra
        .attr("y", d => yScale(d.make) + yScale.bandwidth() / 2) // Calcula la posición vertical del texto para centrarlo en la barra
        .attr("dy", ".35em") // Ajusta la posicion vertical del texto para centrarlo correctamente
        .text(d => `${d3.format(".2f")(d.average)}`); // Establece el contenido del texto como el valor de consumo promedio formateado con dos decimales


    // Evento click en las barras para permitir interaccion
    // Cuando se hace click, se muestra el otro grafico con detalle sobre el tipo de combustible para la marca seleccionada
    svg.selectAll("rect") // Selecciona todos los elementos 'rect' dentro del SVG
        .on("click", function (event, d) { // Agrega un evento de clic a cada barra
            // Quitar borde de todas las barras
            svg.selectAll("rect") // Selecciona todas las barras nuevamente para quitar cualquier borde previamente establecido
                .attr("stroke", "none") // Quita el borde de todas las barras
                .attr("stroke-width", 2); // Establece el ancho del borde en 2

            // Resaltar la barra seleccionada
            d3.select(this) // Selecciona la barra que se hizo clic
                .attr("stroke", "brown") // Establece el color del borde de la barra seleccionada en marron
                .attr("stroke-width", 4); // Establece el ancho del borde en 4 para resaltar la barra seleccionada

            selectedMake = d.make; // Almacena la marca seleccionada en una variable
            drawFuelChart(selectedMake, fullData); // Llama a una funcion para dibujar un gráfico de combustible basado en la marca seleccionada y los datos completos
        });
}



// Muestra los tipos de combustible usados por los modelos de la marca seleccionada
function drawFuelChart(make, fullData) {

    // Se limpian elementos antiguos para evitar superposiciones
    d3.select("#right svg").remove(); // Elimina el grafico de barras anterior
    d3.select("#selectedMake").remove(); // Elimina el nombre de marca anterior
    d3.select("#right-graph-title").remove(); // Elimina el titulo anterior del grafico de combustibles
    d3.select("#carList").remove(); // Elimina la lista de modelos de coches anterior
    d3.select("#sortButton").remove(); // Elimina el boton de ordenamiento anterior
    d3.select("#btn").remove(); // Elimina el boton de ordenamiento anterior
    d3.select("#right h4").remove(); // Elimina un elemento de titulo anterior si existe

    // Filtramos los datos por la marca seleccionada
    let selectedData = fullData.filter(item => item.MAKE === make);

    // Mostramos el nombre de la marca seleccionada
    d3.select("#right")
        .append("h1")
        .attr("id", "selectedMake") // Establecer un identificador unico para el titulo
        .text(make) // Establecer el texto como el nombre de la marca
        .style("text-align", "center") // Alinear el texto al centro
        .style("color", "brown") // Cambiar el color del texto para resaltarlo
        .style("font-weight", "bolder"); // Establecer el peso de la fuente en negrita

    // Titulo del grafico de combustibles
    d3.select("#right")
        .append("h2")
        .attr("id", "right-graph-title")
        .style("text-align", "center") // Alinear el texto al centro
        .text("Distribución de tipos de combustible"); // Establecer el texto del título

    // Boton de ordenamiento para cambiar el orden de visualizacion (ascendente o descendente)
    const sortButton = d3.select("#right")
        .append("button")
        .attr("id", "sortButton")
        .attr("id", "btn") 
        .text("Ordenar por consumo") // Establecer el texto del boton
        .on("click", function () {
            isAscending = !isAscending; // Cambiar el estado del ordenamiento
            drawSortedCars(make, fullData); // Indicar top 5 vehiculos con el nuevo orden
        });

    // Contador de combustibles
    let fuelCount = {
        'X': 0,
        'Z': 0,
        'O': 0
    }; 

    // Cuenta cuantos modelos usan cada tipo de combustible
    selectedData.forEach(item => {
        if (item.FUEL === 'X') fuelCount['X']++; // Incrementa el contador de 'X'
        else if (item.FUEL === 'Z') fuelCount['Z']++; // Incrementa el contador de 'Z'
        else fuelCount['O']++; // Incrementa el contador de 'O'
    });

    let total = Object.values(fuelCount).reduce((acc, val) => acc + val, 0);

    // Verifica si no hay datos disponibles para la marca seleccionada
    if (total === 0) {
        console.error("No hay datos disponibles para la marca seleccionada.");
        return;
    }

    // Se crea un array de objetos con la cantidad y porcentaje de cada tipo de combustible
    let fuelData = Object.keys(fuelCount).map(type => ({
        type,
        count: fuelCount[type], // Cantidad de modelos para este tipo de combustible
        percentage: ((fuelCount[type] || 0) / total) * 100 // Porcentaje de modelos para este tipo de combustible
    })).sort((a, b) => b.count - a.count); // Ordena el array por la cantidad de combustible


    // Crear grafico de combustibles
    const marginFuel = { top: 30, right: 20, bottom: 50, left: 60 }; // Establecer los margenes del grafico
    const widthFuel = 400 - marginFuel.left - marginFuel.right; // Calcular el ancho del grafico
    const heightFuel = 300 - marginFuel.top - marginFuel.bottom; // Calcular la altura del grafico

    // Crear un nuevo lienzo SVG para dibujar el grafico de tipos de combustible por marca
    const svgFuel = d3.select("#right") // Seleccionar el elemento con id "right"
        .append("svg") // Agregar un elemento SVG al DOM para la grafica de tipos de combustible para la marca seleccionada
        .attr("width", widthFuel + marginFuel.left + marginFuel.right) // Establecer el ancho del lienzo SVG
        .attr("height", heightFuel + marginFuel.top + marginFuel.bottom) // Establecer la altura del lienzo SVG
        .append("g") // Agregar un elemento de grupo al lienzo SVG
        .attr("transform", `translate(${marginFuel.left},${marginFuel.top})`); // Mover el grupo al margen izquierdo y superior

    // Escalas para los ejes de combustibles
    const xScaleFuel = d3.scaleBand() 
        .domain(fuelData.map(d => d.type)) // Dominio: tipos de combustible
        .range([0, widthFuel]) // Rango: ancho del grafico
        .padding(0.2); // Espacio entre las bandas

    const yScaleFuel = d3.scaleLinear() 
        .domain([0, d3.max(fuelData, d => d.count)]) // Dominio: desde 0 hasta el maximo valor de conteo de modelos
        .range([heightFuel, 0]); // Rango: desde la altura del grafico hasta 0 (inverso para el eje Y)

    // Barras de combustible con transicion y tooltip
    const bars = svgFuel.selectAll("rect") // Selecciona todos los elementos 'rect' dentro del SVG
        .data(fuelData) // Une los datos a los elementos seleccionados
        .join("rect")  // Añade nuevos elementos "rect" si hay mas datos que rectangulos, actualiza las propiedades de los rectangulos existentes, elimina si hay rectangulos sobrantes 
        .transition()  // Inicia la animacion
        .duration(800)  // Diración de 800 milisegundos
        .ease(d3.easeBackOut.overshoot(1.4))  // Animacion de tipo rebote
        .delay(175)  // Retraso de 175 milisegundos
        .attr("x", d => xScaleFuel(d.type)) // Establece la posicion horizontal de las barras según el tipo de combustible
        .attr("y", d => yScaleFuel(d.count)) // Establece la posicion vertical de las barras según la cantidad de modelos
        .attr("width", xScaleFuel.bandwidth()) // Establece el ancho de las barras según el ancho de banda de la escala X
        .attr("height", d => heightFuel - yScaleFuel(d.count)) // Establece la altura de las barras según la cantidad de modelos
        .attr("fill", (d, i) => ['blue', 'green', 'orange'][i]) // Establece el color de las barras según su índice
        .attr("stroke", "black") // Establece el color del borde de las barras
        .attr("stroke-width", 4) // Establece el ancho del borde de las barras
        .attr("height", d => heightFuel - yScaleFuel(d.count)); // Establece la altura final de las barras despues de la transicion


    // Etiquetas de porcentaje para los combustibles
    svgFuel.selectAll("text.percentage") // Selecciona todos los elementos de texto con la clase "percentage"
        .data(fuelData) // Une los datos a los elementos seleccionados
        .enter() // Ingresa a los datos que no tienen elementos asociados
        .append("text") // Agrega un elemento de texto para cada dato sin elemento asociado
        .attr("class", "percentage") // Asigna la clase "percentage" al elemento de texto
        .attr("x", d => xScaleFuel(d.type) + xScaleFuel.bandwidth() / 2) // Establece la posicion horizontal del texto centrado en la barra
        .attr("y", d => yScaleFuel(d.count) - 15) // Establece la posicion vertical del texto por encima de la barra
        .attr("dy", ".35em") // Ajusta la posicion vertical del texto
        .text(d => `${d3.format(".2f")(d.percentage)}%`) // Establece el contenido del texto como el porcentaje de cada tipo de combustible
        .attr("class", "fuel-type-text") // Agrega una clase para estilos CSS
        .attr("text-anchor", "middle"); // Alinea el texto al centro horizontalmente

    // Leyenda dentro del grafico para distinguir cada tipo de combustible
    svgFuel.selectAll("text.legend") // Selecciona todos los elementos de texto con la clase "legend"
        .data(fuelData) // Une los datos a los elementos seleccionados
        .join("text") // Agrega un elemento de texto para cada dato sin elemento asociado
        .attr("class", "legend") // Asigna la clase "legend" al elemento de texto
        .attr("x", d => xScaleFuel(d.type) + xScaleFuel.bandwidth() / 2) // Establece la posicion horizontal del texto centrado en la barra
        .attr("y", heightFuel + 30) // Establece la posicion vertical del texto debajo del eje X
        .attr("dy", ".71em") // Ajusta la posicion vertical del texto
        .text(d => { // Establece el contenido del texto segun el tipo de combustible
            switch (d.type) {
                case 'X': return 'Gasolina';
                case 'Z': return 'Diesel';
                case 'O': return 'Otro';
            }
        })
        .attr("text-anchor", "middle") // Alinea el texto al centro horizontalmente
        .attr("class", "fuel-type-text") // Agrega una clase para estilos CSS
        .attr("fill", "black"); // Establece el color del texto

    // Lista de coches de mayor a menor consumo
    const sortedCars = selectedData.sort((a, b) => {
        if (isAscending) {
            return a['FUEL CONSUMPTION'] - b['FUEL CONSUMPTION']; // Orden ascendente si isAscending es verdadero
        } else {
            return b['FUEL CONSUMPTION'] - a['FUEL CONSUMPTION']; // Orden descendente si isAscending es falso
        }
    }).slice(0, 5); // Tomar los 5 coches de mayor consumo

    // Mostramos el consumo ordenado de los coches para la marca seleccionada
    d3.select("#right") // Selecciona el elemento con id "right" (grafica de la derecha)
        .append("div") // Agrega un div al DOM
        .attr("id", "carList") // Establece un identificador único para el div
        .selectAll("p") // Selecciona todos los elementos de parrafo dentro del div
        .data(sortedCars) // Une los datos de los coches ordenados a los elementos seleccionados
        .enter() // Ingresa a los datos que no tienen elementos asociados
        .append("p") // Agrega un elemento de parrafo para cada dato sin elemento asociado
        .style("padding-left", "15px") // Establece el relleno izquierdo del parrafo
        .text(d => `${d.MODEL} - consumo de  ${d3.format(".2f")(d['FUEL CONSUMPTION'])} L/100km`); // Establece el contenido del parrafo con el modelo del coche y su consumo de combustible formateado
}

// Indica los coches de la marca seleccionada ordenados por consumo de combustible
// Parametro data: array de objetos con las marcas de vehiculos y sus consumos promedio
// Parametro fullData: conjunto de datos sin procesar, directamente del csv
// La funcion se encarga de mostrar los 5 coches de la marca seleccionada con mayor o menor consumo de combustible, segun la eleccion del usuario
function drawSortedCars(make, fullData) {

    // Este codigo se encuentra comentado en la funcion anterior
    let selectedData = fullData.filter(item => item.MAKE === make);

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

    // Lista de coches de mayor a menor consumo
    const sortedCars = selectedData.sort((a, b) => {
        if (isAscending) {
            return a['FUEL CONSUMPTION'] - b['FUEL CONSUMPTION']; // Orden ascendente si isAscending es verdadero
        } else {
            return b['FUEL CONSUMPTION'] - a['FUEL CONSUMPTION']; // Orden descendente si isAscending es falso
        }
    }).slice(0, 5); // Tomar top 5 coches segun consumo

    d3.select("#carList").remove(); // Elimina la lista de modelos de coches anterior

    // Mostramos el consumo ordenado de los coches para la marca seleccionada
    d3.select("#right") // Selecciona el elemento con id "right" (grafica de la derecha)
        .append("div") // Agrega un div al DOM
        .attr("id", "carList") // Establece un identificador unico para el div
        .selectAll("p") // Selecciona todos los elementos de parrafo dentro del div
        .data(sortedCars) // Une los datos de los coches ordenados a los elementos seleccionados
        .enter() // Ingresa a los datos que no tienen elementos asociados
        .append("p") // Agrega un elemento de parrafo para cada dato sin elemento asociado
        .style("padding-left", "15px") // Establece el relleno izquierdo del parrafo
        .text(d => `${d.MODEL} - consumo de  ${d3.format(".2f")(d['FUEL CONSUMPTION'])} L/100km`); // Establece el contenido del párrafo con el modelo del coche y su consumo de combustible formateado

}
