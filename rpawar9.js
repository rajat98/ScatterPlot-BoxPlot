const basePath = "testing/data/"
let quantitativeAttribute = []
let categoricalAttribute = []
const columnsToBeExcluded = ["#", "Name", "Type 2"]
const transitionDuration = 1000;
let selectedDots;
let lasso;
let scatterplotDatapoints
let coords = [];
const lineGenerator = d3.line();


document.addEventListener('DOMContentLoaded', () => {
    populateDatasetDropdown()
    initScatterPlot()
    loadDatasets()
});

const getLoadedDataset = async () => {
    const currentDataset = document.getElementById("dataset-select").value;
    const currentDatasetPath = basePath + currentDataset + ".csv";
    return new Promise((resolve, reject) => {
        d3.csv(currentDatasetPath)
            .then(data => resolve(data))
            .catch(error => reject(error))
    })
}

const populateXAttributeSelectDropDown = () => {
    const xAttributeSelect = document.getElementById("x-attribute-select");
    xAttributeSelect.innerHTML = "";
    quantitativeAttribute.forEach(function (dataset) {
        const option = document.createElement("option");
        option.text = dataset;
        xAttributeSelect.add(option);
    });
}

const populateQuantitativeAndCategoricalAttribute = async () => {
    quantitativeAttribute = []
    categoricalAttribute = []
    await getLoadedDataset()
        .then(data => {
            for (const element of data["columns"]) {
                if (columnsToBeExcluded.includes(element)) {
                    continue
                }
                if (isNaN(data[0][element]) === false) {
                    quantitativeAttribute.push(element)
                } else if (typeof (data[0][element]) === "string") {
                    categoricalAttribute.push(element)
                }
            }
        })
        .catch(error => {
            console.log("error loading csv")
        })

}

const populateYAttributeSelectDropDown = () => {
    const yAttributeSelect = document.getElementById("y-attribute-select");
    yAttributeSelect.innerHTML = "";
    quantitativeAttribute.forEach(function (dataset) {
        const option = document.createElement("option");
        option.text = dataset;
        yAttributeSelect.add(option);
    });
}
const populateColorSelectDropDown = () => {
    const colorSelect = document.getElementById("color-select");
    colorSelect.innerHTML = "";
    categoricalAttribute.forEach(function (dataset) {
        const option = document.createElement("option");
        option.text = dataset;
        colorSelect.add(option);
    });
}


const populateBoxplotSelectDropDown = () => {
    const colorSelect = document.getElementById("boxplot-select");
    colorSelect.innerHTML = "";
    quantitativeAttribute.forEach(function (dataset) {
        const option = document.createElement("option");
        option.text = dataset;
        colorSelect.add(option);
    });
}
const loadDatasets = async () => {
    await populateQuantitativeAndCategoricalAttribute()
    populateXAttributeSelectDropDown()
    populateYAttributeSelectDropDown()
    populateColorSelectDropDown()
    populateBoxplotSelectDropDown()

    await drawScatterPlot()
}


let boxplotSvg, width, height, margin, colorScale, xScale, yScale, xAxis, yAxis, xAxisGroup, yAxisGroup;
const initScatterPlot = async () => {
    // Set up margins and dimensions
    margin = {top: 40, right: 50, bottom: 40, left: 70};
    width = 1200 - margin.left - margin.right;
    height = 700 - margin.top - margin.bottom;

    // Create SVG element
    boxplotSvg = d3.select("#scatter_plot_svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    colorScale = d3.scaleOrdinal(d3.schemePaired);

    await getLoadedDataset()
        .then(rawData => {
            const currentXAttribute = document.getElementById("x-attribute-select").value;
            const currentYAttribute = document.getElementById("y-attribute-select").value;
            const currentColorAttribute = document.getElementById("color-select").value;

            const data = rawData.map(item => {
                return {
                    x: item[currentXAttribute],
                    y: item[currentYAttribute],
                    colorAttribute: item[currentColorAttribute]
                }
            })
            xScale = d3.scaleLinear()
                .domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
                .range([0, width]);

            yScale = d3.scaleLinear()
                .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])
                .range([height, 0]);

            // Add x-axis label
            boxplotSvg.append('text')
                .attr('x', width / 2)
                .attr('y', height + margin.bottom)
                .attr('text-anchor', 'middle')
                .attr("class", "scatterPlotXLabel")
                .style("font-size", "12px")
                .text(currentXAttribute);

            // Add y-axis label
            boxplotSvg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('x', -width / 3)
                .attr('y', margin.left / 2 - 70)
                .attr('text-anchor', 'middle')
                .attr("class", "scatterPlotYLabel")
                .style("font-size", "12px")
                .text(currentYAttribute);

        })

    // Create axis
    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);
    xAxisGroup = boxplotSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    yAxisGroup = boxplotSvg.append("g")
        .call(yAxis);
}

const drawScatterPlot = async () => {
    clearLasso()
    clearLassoFormatting()
    await getLoadedDataset()
        .then(rawData => {
            const currentXAttribute = document.getElementById("x-attribute-select").value;
            const currentYAttribute = document.getElementById("y-attribute-select").value;
            const currentColorAttribute = document.getElementById("color-select").value;
            let idGen = 0;
            const data = rawData.map(item => {
                return {
                    x: Number(item[currentXAttribute]),
                    y: Number(item[currentYAttribute]),
                    colorAttribute: item[currentColorAttribute],
                    id: idGen++,
                    item: item
                }
            })

            xScale.domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
            yScale.domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])

            // Update axes
            xAxisGroup.transition()
                .duration(transitionDuration).call(xAxis);
            yAxisGroup.transition()
                .duration(transitionDuration).call(yAxis);

            // Update x-axis label
            boxplotSvg.selectAll('.scatterPlotXLabel').text(currentXAttribute);

            // Update y-axis label
            boxplotSvg.selectAll('.scatterPlotYLabel').text(currentYAttribute);

            scatterplotDatapoints = boxplotSvg.selectAll(".scatterplotDatapoints")
                .data(data)

            scatterplotDatapoints
                .join(
                    enter => enter.append("circle")
                        .attr("cx", d => xScale(d.x))
                        .attr("cy", d => yScale(d.y))
                        .attr("r", 4)
                        .style("fill", d => colorScale(d.colorAttribute))
                        .attr("stroke", "#3D898A")
                        .attr("id", (d) => {
                            return "dot-" + d.id;
                        })
                        .style('stroke-width', '1.5')
                        .attr("class", "scatterplotDatapoints"),
                    update => update.transition()
                        .duration(transitionDuration)
                        .attr("cx", d => xScale(d.x))
                        .attr("cy", d => yScale(d.y))
                        .style("fill", d => colorScale(d.colorAttribute))
                        .attr("id", (d) => {
                            return "dot-" + d.id;
                        }),
                    exit => exit.remove()
                )

            const drag = d3.drag()
                .on("start", dragStart)
                .on("drag", dragMove)
                .on("end", dragEnd);

            d3.select("#scatter_plot_svg").call(drag);

        })
        .catch(error => console.log(error))

}


const pointInPolygon = (point, vs) => {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    var x = point[0] + margin.left,
        y = point[1] + margin.top;

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
            yi = vs[i][1];
        var xj = vs[j][0],
            yj = vs[j][1];

        var intersect =
            yi > y != yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
};

const drawPath = () => {
    d3.select("#lasso")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("fill", "#00000054")
        .attr("d", lineGenerator(coords));
}

const dragStart = (event)=> {
    console.log("drag start")
    clearLassoFormatting()
    let mouseX = event.sourceEvent.offsetX;
    let mouseY = event.sourceEvent.offsetY;
    coords = [];
    scatterplotDatapoints.attr("fill", "steelblue");
    d3.select("#lasso").remove();
    d3.select("#scatter_plot_svg")
        .append("path")
        .attr("id", "lasso");
}

const dragMove = (event) => {
    let mouseX = event.sourceEvent.offsetX;
    let mouseY = event.sourceEvent.offsetY;
    coords.push([mouseX, mouseY]);
    drawPath();
}

const dragEnd = () => {
    console.log("drag end")
    selectedDots = [];
    d3.selectAll(".scatterplotDatapoints").each((d, i) => {
        let point = [
            xScale(d.x),
            yScale(d.y),
        ];
        if (pointInPolygon(point, coords)) {
            d3.select("#dot-" + d.id)
                .attr("r", 8);
            selectedDots.push(d.id);
        }
    });
    const selectedPoints = getSelectedPoints(selectedDots)
    drawBoxPlot(selectedPoints);
    console.log(`select: ${selectedDots}`);
}

const getSelectedPoints = (selectedDots) => {
    let selectedPoints = []
    for (let id in selectedDots) {
        const data = d3.select("#dot-" + id);
        selectedPoints.push(data._groups[0][0].__data__)
    }

    return selectedPoints
}
const clearLassoFormatting = () => {
    if (selectedDots !== undefined)
        for (let id of selectedDots) {
            d3.select("#dot-" + id)
                .attr("r", 4);
        }
}

const clearLasso = () => {
    d3.select("#lasso").remove();
}

const populateDatasetDropdown=()=> {
    const datasets = ["penguins_cleaned", "Pokemon", "Test1", "Test2"];
    const datasetSelect = document.getElementById("dataset-select");

    datasets.forEach(function (dataset) {
        const option = document.createElement("option");
        option.text = dataset;
        datasetSelect.add(option);
    });
}

const updateXAttribute = async () => {
    await drawScatterPlot()
}

const updateYAttribute = async () => {
    await drawScatterPlot()
}

const updateColorAttribute = async () => {
    await drawScatterPlot()
}


const drawBoxPlot = (selectedPoints) => {
    const boxPlotHeight = 700;
    const boxPlotWidth = 1200;
    const boxplotSelectAttribute = document.getElementById("boxplot-select").value;
    let data = []
    let uniqueColorAttributeValues = new Set()
    selectedPoints.forEach(p => {
        uniqueColorAttributeValues.add(p["colorAttribute"])
        data.push({
            colorAttribute: p["colorAttribute"],
            boxplotAttribute: Number(p["item"][boxplotSelectAttribute])
        })
    })

    const margin = {top: 20, right: 30, bottom: 20, left: 70};
    const padding = 20;
    const width = boxPlotWidth - margin.left - margin.right;
    const height = boxPlotHeight - margin.top - margin.bottom;

    const boxplotSvg = d3
        .select("#boxplot_svg")
        .attr("width", boxPlotWidth)
        .attr("height", boxPlotHeight);

    boxplotSvg.selectAll("*").remove();
    boxplotSvg.append("g");

    if (selectedPoints.length === 0) {
        return;
    }

    const colorAttribute = document.getElementById("color-select").value;
    const boxplotAttribute = document.getElementById("boxplot-select").value;

    const groupedData = d3.group(data, (d) => d["colorAttribute"]);

    const minValues = Array.from(groupedData.values(), (group) =>
        d3.min(group, (d) => +d["boxplotAttribute"])
    );

    const maxValues = Array.from(groupedData.values(), (group) =>
        d3.max(group, (d) => +d["boxplotAttribute"])
    );

    const maxBandwidth = 80;
    const domain = [...groupedData.keys()];
    const numberOfBars = domain.length;
    const totalPadding = 2 * padding;
    const totalBandWidth = numberOfBars * maxBandwidth;
    const gapsWidth = maxBandwidth * 0.2 * (numberOfBars - 1);
    let svgWidth = totalBandWidth + gapsWidth + totalPadding;
    svgWidth = Math.min(svgWidth, width);

    const xScale = d3
        .scaleBand()
        .domain([...groupedData.keys()])
        .range([margin.left + padding, svgWidth + margin.left - padding])
        .padding(0.2);

    const xAxisLabelPos = [
        (margin.left + 2 * padding + svgWidth) / 2,
        margin.bottom + 12,
    ];

    boxplotSvg
        .append("g")
        .attr("transform", `translate(0, ${height + padding})`)
        .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", xAxisLabelPos[0])
        .attr("y", xAxisLabelPos[1])
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text(colorAttribute);


    const yScale = d3
        .scaleLinear()
        .domain([d3.min(minValues), d3.max(maxValues)])
        .range([margin.top + height - padding, margin.top + padding])
        .clamp(true);

    boxplotSvg
        .append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", padding - boxPlotHeight / 2)
        .attr("y", -padding * 2)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text(boxplotAttribute);

    groupedData.forEach((value, key) => {
        const values = value.map((d) => +d["boxplotAttribute"]);
        values.sort(d3.ascending);

        const g = boxplotSvg.append("g");
        let outliers;

        if (values.length > 5) {
            const q1 = d3.quantile(values, 0.25);
            const median = d3.quantile(values, 0.5);
            const q3 = d3.quantile(values, 0.75);
            const interQuartileRange = q3 - q1;
            const lowerBound = Math.max(q1 - 1.5 * interQuartileRange, values[0]);
            const upperBound = Math.min(q3 + 1.5 * interQuartileRange, values[values.length - 1]);

            g.append("rect")
                .attr("x", xScale(key))
                .attr("y", yScale(q3))
                .attr("width", xScale.bandwidth())
                .attr("height", yScale(q1) - yScale(q3))
                .attr("fill", colorScale(key))
                .style("stroke", "black")
                .style("opacity", 0.5);

            g.append("line")
                .attr("x1", xScale(key))
                .attr("x2", xScale(key) + xScale.bandwidth())
                .attr("y1", yScale(median))
                .attr("y2", yScale(median))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .style("opacity", 0.5);

            g.append("line")
                .attr("x1", xScale(key) + xScale.bandwidth() / 2)
                .attr("x2", xScale(key) + xScale.bandwidth() / 2)
                .attr("y1", yScale(lowerBound))
                .attr("y2", yScale(q1))
                .attr("stroke", "black")
                .style("opacity", 0.5);

            g.append("line")
                .attr("x1", xScale(key) + xScale.bandwidth() / 2)
                .attr("x2", xScale(key) + xScale.bandwidth() / 2)
                .attr("y1", yScale(upperBound))
                .attr("y2", yScale(q3))
                .attr("stroke", "black")
                .style("opacity", 0.5);

            outliers = values.filter((v) => v < lowerBound || v > upperBound);
        } else {
            outliers = values;
        }

        g.selectAll("outliers")
            .data(outliers)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return xScale(key) + Math.random() * xScale.bandwidth();
            })
            .attr("cy", function (d) {
                return yScale(+d);
            })
            .attr("r", 4)
            .style("fill", function (d) {
                return colorScale(key);
            })
            .attr("stroke", "black");
    });

}
