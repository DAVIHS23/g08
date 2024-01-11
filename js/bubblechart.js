let date = new Date();

height = 560
width = 900

margin = ({ top: 20, right: 20, bottom: 35, left: 40 })

x = d3.scaleLog([200, 1e5], [margin.left, width - margin.right])

y = d3.scaleLinear([14, 86], [height - margin.bottom, margin.top])

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

function Legend(color, {
    title,
    tickSize = 6,
    width = 320,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues
} = {}) {

    function ramp(color, n = 256) {
        const canvas = document.createElement("canvas");
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
            context.fillStyle = color(i / (n - 1));
            context.fillRect(i, 0, 1, 1);
        }
        return canvas;
    }

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");

    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    // Continuous
    if (color.interpolate) {
        const n = Math.min(color.domain().length, color.range().length);

        x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }

    // Sequential
    else if (color.interpolator) {
        x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
            { range() { return [marginLeft, width - marginRight]; } });

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
        if (!x.ticks) {
            if (tickValues === undefined) {
                const n = Math.round(ticks + 1);
                tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
                tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
            }
        }
    }

    // Threshold
    else if (color.invertExtent) {
        const thresholds
            = color.thresholds ? color.thresholds() // scaleQuantize
                : color.quantiles ? color.quantiles() // scaleQuantile
                    : color.domain(); // scaleThreshold

        const thresholdFormat
            = tickFormat === undefined ? d => d
                : typeof tickFormat === "string" ? d3.format(tickFormat)
                    : tickFormat;

        x = d3.scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", d => d);

        tickValues = d3.range(thresholds.length);
        tickFormat = i => thresholdFormat(thresholds[i], i);
    }

    // Ordinal
    else {
        x = d3.scaleBand()
            .domain(color.domain())
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.domain())
            .join("rect")
            .attr("x", x)
            .attr("y", marginTop)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", color);

        tickAdjust = () => { };
    }

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("class", "title")
            .text(title));

    return svg.node();
}

fetch('../data/gapminder/nations.json')
    .then(response => response.json())
    .then(data => {
        // Convert data to the format expected by your scrubber
        const formattedData = data.map(({ name, region, income, population, lifeExpectancy }) => ({
            name,
            region,
            income: parseSeries(income),
            population: parseSeries(population),
            lifeExpectancy: parseSeries(lifeExpectancy)
        }));

        bisectDate = d3.bisector(([date]) => date).left

        function valueAt(values, date) {
            const i = bisectDate(values, date, 0, values.length - 1);
            const a = values[i];
            if (i > 0) {
                const b = values[i - 1];
                const t = (date - a[0]) / (b[0] - a[0]);
                return a[1] * (1 - t) + b[1] * t;
            }
            return a[1];
        }

        function dataAt(date) {
            return formattedData.map(d => ({
                name: d.name,
                region: d.region,
                income: valueAt(d.income, date),
                population: valueAt(d.population, date),
                lifeExpectancy: valueAt(d.lifeExpectancy, date)
            }));
        }

        currentData = dataAt(date)

        console.log("Current Data:", currentData);

        const bubble_svg = d3.select("#bubble_chart").append("svg")
            .attr("viewBox", [0, 0, width, height]);

        const bubble_chart = (() => {
            bubble_svg.append("g")
                .call(xAxis);

            bubble_svg.append("g")
                .call(yAxis);

            bubble_svg.append("g")
                .call(grid);

            const colorScale = d3.scaleOrdinal()
                .domain(data.map(d => d.continent))
                .range(d3.schemeCategory10);

            const circle = bubble_svg.append("g")
                .attr("stroke", "black")
                .selectAll("circle")
                .data(dataAt(1800), d => d.name)
                .join("circle")
                .sort((a, b) => d3.descending(a.population, b.population))
                .attr("cx", d => x(d.income))
                .attr("cy", d => y(d.lifeExpectancy))
                .attr("r", d => radius(d.population))
                .attr("fill", d => colorScale(d.region))
                .call(circle => circle.append("title")
                    .text(d => [d.name, d.region].join("\n")));

            return Object.assign(bubble_svg.node(), {
                update(data) {
                    circle.data(data, d => d.name)
                        .sort((a, b) => d3.descending(a.population, b.population))
                        .attr("cx", d => x(d.income))
                        .attr("cy", d => y(d.lifeExpectancy))
                        .attr("r", d => radius(d.population));
                }
            });

        })();

        const world_svg = d3.select("#world_chart").append("svg")
        .attr("viewBox", [0, 0, width, height]);


        // Map and projection
        const path = d3.geoPath();
        const projection = d3.geoMercator()
            .scale(70)
            .center([0, 20])
            .translate([width / 2, height / 2]);

        // Data and color scale
        let map_data = new Map()
        const colorScale = d3.scaleThreshold()
            .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
            .range(d3.schemeBlues[7]);

        // Load external data and boot
        Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv", function (d) {
                data.set(d.code, +d.pop)
            })
        ]).then(function (loadData) {
            let topo = loadData[0]

            // Draw the map
            world_svg.append("g")
                .selectAll("path")
                .data(topo.features)
                .join("path")
                // draw each country
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                // set the color of each country
                .attr("fill", function (d) {
                    d.total = map_data.get(d.id) || 0;
                    return colorScale(d.total);
                })
        })

        function Scrubber(values, {
            format = value => value,
            initial = 0,
            direction = 1,
            delay = null,
            autoplay = true,
            loop = true,
            loopDelay = null,
            alternate = false
        } = {}) {
            values = Array.from(values);

            // Create form element
            const form = document.createElement('form');
            form.style.font = '12px var(--sans-serif)';
            form.style.fontVariantNumeric = 'tabular-nums';
            form.style.display = 'flex';
            form.style.height = '33px';
            form.style.alignItems = 'center';

            // Create button element
            const button = document.createElement('button');
            button.setAttribute('name', 'b');
            button.setAttribute('type', 'button');
            button.style.marginRight = '0.4em';
            button.style.width = '5em';
            form.appendChild(button);

            // Create label element
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';

            // Create input range element
            const input = document.createElement('input');
            input.setAttribute('name', 'i');
            input.setAttribute('type', 'range');
            input.setAttribute('min', '0');
            input.setAttribute('max', values.length - 1);
            input.setAttribute('value', initial);
            input.setAttribute('step', '1');
            input.style.width = '180px';
            label.appendChild(input);

            // Create output element
            const output = document.createElement('output');
            output.setAttribute('name', 'o');
            output.style.marginLeft = '0.4em';
            label.appendChild(output);

            form.appendChild(label);

            let frame = null;
            let timer = null;
            let interval = null;

            function start() {
                button.textContent = 'Pause';
                if (delay === null) frame = requestAnimationFrame(tick);
                else interval = setInterval(tick, delay);
            }

            function stop() {
                button.textContent = 'Play';
                if (frame !== null) cancelAnimationFrame(frame), frame = null;
                if (timer !== null) clearTimeout(timer), timer = null;
                if (interval !== null) clearInterval(interval), interval = null;
            }

            function running() {
                return frame !== null || timer !== null || interval !== null;
            }

            function tick() {
                if (input.valueAsNumber === (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)) {
                    if (!loop) return stop();
                    if (alternate) direction = -direction;
                    if (loopDelay !== null) {
                        if (frame !== null) cancelAnimationFrame(frame), frame = null;
                        if (interval !== null) clearInterval(interval), interval = null;
                        timer = setTimeout(() => (step(), start()), loopDelay);
                        return;
                    }
                }
                if (delay === null) frame = requestAnimationFrame(tick);
                step();
            }

            function step() {
                input.valueAsNumber = (input.valueAsNumber + direction + values.length) % values.length;
                input.dispatchEvent(new CustomEvent('input', { bubbles: true }));
            }

            input.oninput = event => {
                if (event && event.isTrusted && running()) stop();
                form.value = values[input.valueAsNumber];
                output.value = format(form.value, input.valueAsNumber, values);
                const newDate = form.value; // Assuming form.value gives the current date
                const newData = dataAt(newDate); // Fetch new data for this date
                const valuemap = new Map(newData.map(d => [d.name, d.lifeExpectancy]));
                console.log("valuemap:", valuemap);
                const color = d3.scaleSequential(d3.extent(valuemap.values()), d3.interpolateYlGnBu);
                console.log("color:", color);
                console.log("newData:", newData);
                bubble_chart.update(newData);
            };

            button.onclick = () => {
                if (running()) return stop();
                direction = alternate && input.valueAsNumber === values.length - 1 ? -1 : 1;
                input.valueAsNumber = (input.valueAsNumber + direction) % values.length;
                input.dispatchEvent(new CustomEvent('input', { bubbles: true }));
                start();
            };

            input.oninput();
            if (autoplay) start();
            else stop();

            return form;
        }

        function parseSeries(series) {
            return series.map(([year, value]) => [new Date(Date.UTC(year, 0, 1)), value]);
        }

        color = d3.scaleOrdinal(formattedData.map(d => d.region), d3.schemeCategory10).unknown("black")

        interval = d3.utcMonth

        dates = interval.range(
            d3.min(formattedData, d => {
                return d3.min([
                    d.income[0],
                    d.population[0],
                    d.lifeExpectancy[0]
                ], ([date]) => date);
            }),
            d3.min(formattedData, d => {
                return d3.max([
                    d.income[d.income.length - 1],
                    d.population[d.population.length - 1],
                    d.lifeExpectancy[d.lifeExpectancy.length - 1]
                ], ([date]) => date);
            })
        )

        // Now you can use formattedData with your scrubber
        date = Scrubber(dates, { format: d => d.getUTCFullYear(), loop: false })
        document.getElementById('scrubber-container').appendChild(date);

    })
    .catch(error => console.error('Error loading data:', error));