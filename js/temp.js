                // Funktion, um das world_chart zu aktualisieren
                function updateWorldChart(currentData) {
                    const valuemap = new Map(currentData.map(d => [d.name, d.lifeExpectancy]));
                    const color = d3.scaleSequential(d3.extent(valuemap.values()), d3.interpolateYlGnBu);
                
                    world_svg.selectAll("path")
                        .data(countries.features) // Bind the new data
                        .attr("fill", d => {
                            const value = valuemap.get(d.properties.name);
                            return value ? color(value) : 'default-color'; // Handle missing data
                        });
                }