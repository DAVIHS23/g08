
height = 560
width = 900

margin = ({ top: 20, right: 20, bottom: 35, left: 40 })

// Laden der CSV-Daten
d3.csv('data/gapminder/merged_dataset.csv').then(function (data) {
    console.log("data loaded")
    // Konvertierung der Daten (angepasst an Ihre CSV-Struktur)
    data.forEach(d => {
        d.year = +d.year;
        d.life_expectancy = +d.life_expectancy;
        d.population = +d.population;
        d.gdp = +d.gdp;
        d.hdi = +d.hdi;
        //console.log("country:" + d.country + " continent:" + d.continent + " year:" + d.year + " life_expectancy:" + d.life_expectancy + " population:" + d.population + " gdp:" + d.gdp + " hdi:" + d.hdi)
    });

    x = d3.scaleLog([200, 1e5], [margin.left, width - margin.right])
    console.log("x axis" + x)

    y = d3.scaleLinear([14, 86], [height - margin.bottom, margin.top])
    console.log("y axis" + y)

    // SVG-Element erstellen
    const svg = d3.select("#bubble_chart").append("svg")
        .attr("viewBox", [0, 0, 960, 500]);

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    svg.append("g")
        .call(grid);

    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.continent))
        .range(d3.schemeCategory10);

    const circle = svg.append("g")
        .attr("stroke", "black")
        .selectAll("circle")
        .data(dataAt(1800), d => d.name)
        .join("circle")
        .sort((a, b) => d3.descending(a.population, b.population))
        .attr("cx", d => x(d.gdp))
        .attr("cy", d => y(d.life_expectancy))
        .attr("r", d => radius(d.population))
        .attr("fill", d => colorScale(d.continent))
        .call(circle => circle.append("title")
            .text(d => [d.country, d.continent].join("\n")));

    function dataAt(date) {
        return data.map(d => ({
            name: d.country,
            continent: d.continent,
            income: d.gdp,
            population: d.population,
            lifeExpectancy: d.life_expectancy,
            data: d[date]
        }));
    }

    return Object.assign(svg.node(), {
        update(data) {
            circle.data(data, d => d.name)
                .sort((a, b) => d3.descending(a.population, b.population))
                .attr("cx", d => x(d.gdp))
                .attr("cy", d => y(d.life_expectancy))
                .attr("r", d => radius(d.population));
        }
    });
});

bisectDate = d3.bisector(([date]) => date).left

function parseSeries(series) {
    return series.map(([year, value]) => [new Date(Date.UTC(year, 0, 1)), value]);
}

interval = d3.utcMonth

radius = d3.scaleSqrt([0, 5e8], [0, width / 24])


xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80, ","))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", width)
        .attr("y", margin.bottom - 4)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text("Income per capita (dollars) →"))

yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ Life expectancy (years)"))

grid = g => g
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.1)
    .call(g => g.append("g")
        .selectAll("line")
        .data(x.ticks())
        .join("line")
        .attr("x1", d => 0.5 + x(d))
        .attr("x2", d => 0.5 + x(d))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom))
    .call(g => g.append("g")
        .selectAll("line")
        .data(y.ticks())
        .join("line")
        .attr("y1", d => 0.5 + y(d))
        .attr("y2", d => 0.5 + y(d))
        .attr("x1", margin.left)
        .attr("x2", width - margin.right));



dates = interval.range(
    d3.min(data, d => {
        return d3.min([
            d.income[0],
            d.population[0],
            d.lifeExpectancy[0]
        ], ([date]) => date);
    }),
    d3.min(data, d => {
        return d3.max([
            d.income[d.income.length - 1],
            d.population[d.population.length - 1],
            d.lifeExpectancy[d.lifeExpectancy.length - 1]
        ], ([date]) => date);
    })
)


