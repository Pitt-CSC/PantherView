(function (window, undefined) {
    "use strict";

    // Oakland Coordinates: 40.4388 N, 79.9514 W (40.4388, -79.9514)
    // Cathy Coordinates: 40° 26′ 39″ N, 79° 57′ 11″ W (40.444167, -79.953056)
    const cathyLatLong = [40.444167, -79.953056];
    const map = L.map("mapid", {
        center: cathyLatLong,
        zoom: 15,
        minZoom: 12,
        maxBounds: L.latLngBounds([40.65, -80.25], [40.25, -79.70]),
        maxBoundsViscosity: 0.90
    });

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");

    //Start with sidebar closed if mobile
    if (screen.width <= 800) {
        sidebarToggle.open = 0;
        sidebar.className = "hidden";
        sidebarToggle.className = "fa fa-chevron-right fa-3x";
    } else {
        sidebarToggle.open = 1;
        sidebar.className = "shown";
        sidebarToggle.className = "fa fa-chevron-left fa-3x";
    }

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors"
    }).addTo(map);

    // Array of markers
    const markers = [];

    // Create a new Date object for the current date
    const currentDate = new Date();

    // The following are functions that display records created within 1, 7, and
    // 30 days respectively (assuming all fetched data has been pruned to the last
    // 30 days already)
    function displayPastDay() {
        markers.forEach((marker, i) => {
            //Check if library or other non-dated pin
            if (!marker.incidentYear || !marker.isMapped) {
                return;
            }

            const recordDate = new Date(marker.incidentYear,
                marker.incidentMonth - 1,
                marker.incidentDay);

            if (getDateDifference(currentDate, recordDate) <= 1) {
                marker.inDate = true;
                if (!marker.filtered) {
                    marker.pin.addTo(map);
                }
            } else {
                map.removeLayer(marker.pin);
                marker.inDate = false;
            }
        });
    }

    function displayPastWeek() {
        markers.forEach((marker, i) => {
            if (!marker.incidentYear || !marker.isMapped) {
                return;
            }

            const recordDate = new Date(marker.incidentYear,
                marker.incidentMonth - 1,
                marker.incidentDay);

            if (getDateDifference(currentDate, recordDate) <= 7) {
                marker.inDate = true;
                if (!marker.filtered) {
                    marker.pin.addTo(map);
                }
            } else {
                map.removeLayer(marker.pin);
                marker.inDate = false;
            }
        });
    }

    function displayPastMonth() {
        markers.forEach((marker, i) => {
            if (!marker.isMapped) {
                return;
            }

            marker.inDate = true;

            if (!marker.filtered) {
                marker.pin.addTo(map);
            }
        });
    }

    function filterDisplay(e) {
        const elm = e.target;
        const type = /.+?(?=[A-Z])/.exec(elm.id)[0];

        if (elm.checked) {
            markers.forEach((marker) => {
                if (marker.type === type && marker.isMapped) {
                    if (marker.inDate) {
                        marker.pin.addTo(map);
                    }
                    marker.filtered = false;
                }
            });
        } else {
            markers.forEach((marker) => {
                if (marker.type === type && marker.isMapped) {
                    map.removeLayer(marker.pin);
                    marker.filtered = true;
                }
            });
        }
    }

    //Displays and hides the sidebar
    function toggleSidebar() {
        if (sidebarToggle.open == 1) {
            sidebarToggle.open = 0;
            sidebar.className = "hidden";
            sidebarToggle.className = "fa fa-chevron-right fa-3x";
        } else {
            sidebarToggle.open = 1;
            sidebar.className = "shown";
            sidebarToggle.className = "fa fa-chevron-left fa-3x";
        }
    }

    //Listeners for date buttons
    document.getElementById("radioDay").addEventListener("click", displayPastDay);
    document.getElementById("radioWeek").addEventListener("click", displayPastWeek);
    document.getElementById("radioMonth").addEventListener("click", displayPastMonth);

    //Listener for sidebar toggle
    document.getElementById("sidebarToggle").addEventListener("click", toggleSidebar);

    // Display a notification to the user.
    // Style is optional, can be "error", "warning", or "success"
    function displayNotification(messageText, style, customHTML) {
        const notificationArea = document.getElementById("notifications");
        const box = document.createElement("div");
        box.className = "notification";

        if (style) {
            box.classList.add(style);
        }

        const closeButton = document.createElement("button");
        closeButton.className = "close";
        closeButton.innerHTML = "x";
        closeButton.addEventListnener("click", function() {
            box.style.display = "none";
        });

        box.appendChild(closeButton);

        const textarea = document.createTextNode(messageText);
        box.appendChild(textarea);

        if (customHTML) {
            const customDiv = document.createElement("div");
            customHTML(customDiv);
            box.appendChild(customDiv);
        }

        const topNotification = notificationArea.firstChild;
        notificationArea.insertBefore(box, topNotification);
    }


    // WPRDC data
    const WPRDC_BASE_URL = "https://data.wprdc.org/api/action/datastore_search_sql?sql=";

    // Marker Icons
    const iconTypes = {
        CITY_POLICE: L.divIcon({
            className: "map-pin blue",
            html: "<i class=\"fa fa-balance-scale\"></i>",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -16]
        }),
        CITY_ARREST: L.divIcon({
            className: "map-pin red",
            html: "<i class=\"fa fa-gavel\"></i>",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -16]
        }),
        CITY_311_ICON: L.divIcon({
            className: "map-pin yellow",
            html: "<i class=\"fa fa-commenting\"></i>",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -16]
        }),
        LIBRARY_ICON: L.divIcon({
            className: "map-pin black",
            html: "<i class=\"fa fa-book\"></i>",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -16]
        }),
        CODE_VIOLATION: L.divIcon({
            className: "map-pin green",
            html: "<i class=\"fa fa-times-circle\"></i>",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -16]
        }),
        NON_TRAFFIC_VIOLATION: L.divIcon({
            className: "map-pin darkorchid",
            html: "<i class=\"fa fa-sticky-note-o\"></i>",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -16]
        })
    };

    const WPRDC_DATA_SOURCES = {
        "Police": {
            id: "1797ead8-8262-41cc-9099-cbc8a161924b",
            primaryFiltering: "WHERE \"INCIDENTNEIGHBORHOOD\" LIKE '%Oakland'",
            latLong: ["Y", "X"],
            icon: iconTypes.CITY_POLICE,

            // TODO: Better title and popup messages?
            title: (record) => record["OFFENSES"],
            popup: (record) => record["OFFENSES"],

            processRecord: (record) => {
                // Collect time of incident from the record
                record.incidentYear = parseInt(record.INCIDENTTIME.substring(0,4));
                record.incidentMonth = parseInt(record.INCIDENTTIME.substring(5,8));
                record.incidentDay = parseInt(record.INCIDENTTIME.substring(8,10));
            }
        },

        "Arrest": {
            id: "e03a89dd-134a-4ee8-a2bd-62c40aeebc6f",
            primaryFiltering: "WHERE \"INCIDENTNEIGHBORHOOD\" LIKE '%Oakland'",
            latLong: ["Y", "X"],
            icon: iconTypes.CITY_ARREST,

            // TODO: Better title and popup messages?
            title: (record) => record["OFFENSES"],
            popup: (record) => record["OFFENSES"],

            processRecord: (record) => {
                // Collect time of incident from the record
                record.incidentYear = parseInt(record.ARRESTTIME.substring(0,4));
                record.incidentMonth = parseInt(record.ARRESTTIME.substring(5,8));
                record.incidentDay = parseInt(record.ARRESTTIME.substring(8,10));
            }
        },

        "Code Violation": {
            id: "4e5374be-1a88-47f7-afee-6a79317019b4",
            primaryFiltering: "WHERE \"NEIGHBORHOOD\" LIKE '%Oakland'",
            latLong: ["Y", "X"],
            icon: iconTypes.CODE_VIOLATION,

            // TODO: Better title and popup messages?
            title: (record) => record["VIOLATION"],
            popup: (record) => `<strong>${record["VIOLATION"]}:</strong>
            ${record["LOCATION"]}<br>
            ${record["STREET_NUM"]} ${record["STREET_NAME"]}`,

            processRecord: (record) => {
                // Collect time of incident from the record
                record.incidentYear = parseInt(record.INSPECTION_DATE.substring(0,4));
                record.incidentMonth = parseInt(record.INSPECTION_DATE.substring(5,8));
                record.incidentDay = parseInt(record.INSPECTION_DATE.substring(8,10));
            }
        },

        // City of Pittsburgh 311 data
        // TODO: would be great to prune 311 data to the last 30 days, like the police data
        "311": {
            id: "40776043-ad00-40f5-9dc8-1fde865ff571",
            primaryFiltering: " WHERE \
                                    \"NEIGHBORHOOD\" LIKE '%Oakland' \
                                    AND     \
                                    \"CREATED_ON\" >= (NOW() - '30 day'::INTERVAL)     \
                                ORDER BY \"CREATED_ON\" DESC",
            latLong: ["Y", "X"],
            icon: iconTypes.CITY_311_ICON,

            title: (record) => record["REQUEST_TYPE"],
            popup: (record) => `
              <strong>${record["DEPARTMENT"]}</strong>
              <br> ${record["REQUEST_TYPE"]}`,

            processRecord: (record) => {
                // Collect time of incident from the record
                record.incidentYear = parseInt(record.CREATED_ON.substring(0,4));
                record.incidentMonth = parseInt(record.CREATED_ON.substring(5,8));
                record.incidentDay = parseInt(record.CREATED_ON.substring(8,10));
            }
        },

        // Calls from the library db
        "Library": {
            id: "2ba0788a-2f35-43aa-a47c-89c75f55cf9d",
            primaryFiltering: "WHERE \"Name\" LIKE '%OAKLAND%'",
            latLong: ["Lat", "Lon"],
            icon: iconTypes.LIBRARY_ICON,

            title: (record) => record["Name"],
            popup: (record) => `
              <strong>${record.Name}</strong>
              <br> Address: ${record.Address}
              <br> Phone: ${record.Phone}
              <br> Monday: ${record.MoOpen.substring(0, 5)} - ${record.MoClose.substring(0, 5)}
              <br> Tuesday: ${record.TuOpen.substring(0, 5)} - ${record.TuClose.substring(0, 5)}
              <br> Wednesday: ${record.WeOpen.substring(0, 5)} - ${record.WeClose.substring(0, 5)}
              <br> Thursday: ${record.ThOpen.substring(0, 5)} - ${record.ThClose.substring(0, 5)}
              <br> Friday: ${record.FrOpen.substring(0, 5)} - ${record.FrClose.substring(0, 5)}
              <br> Saturday: ${record.SaOpen.substring(0, 5)} - ${record.SaClose.substring(0, 5)}
              <br> Sunday: ${record.SuOpen.substring(0, 5)} - ${record.SuClose.substring(0, 5)}
              `,

        },
        "Non-Traffic Violation": {
            id: "6b11e87d-1216-463d-bbd3-37460e539d86",
            primaryFiltering: "Where \"NEIGHBORHOOD\" LIKE '%Oakland'",
            latLong: ["Y", "X"],
            icon: iconTypes.NON_TRAFFIC_VIOLATION,

            title: (record) => record["OFFENSES"],
            popup: (record) => record["OFFENSES"],

            processRecord: (record) => {
                record.incidentYear = parseInt(record.CITEDTIME.substring(0,4));
                record.incidentMonth = parseInt(record.CITEDTIME.substring(5,8));
                record.incidentDay = parseInt(record.CITEDTIME.substring(8,10));
            }
        }
    };


    const WPRDC_QUERY_PREFIX = "SELECT * FROM \"";
    const WPRDC_QUERY_SUFFIX = "\" ";

    // Fetch data from West Pennsylvania Regional Data Center using the SQL API
    // TODO: Prune to last 30 days in SQL
    function fetchWPRDCData(dataSourceName, options={}) {
        const dataSource = WPRDC_DATA_SOURCES[dataSourceName];
        let query = WPRDC_QUERY_PREFIX + dataSource.id + WPRDC_QUERY_SUFFIX + dataSource.primaryFiltering;

        if (options.limit) {
          query += " LIMIT " + options.limit;
        }

        return fetch(WPRDC_BASE_URL + query)
            .then((response) => {
                // Inspired by https://github.com/github/fetch#handling-http-error-statuses
                if (response.status >= 200 && response.status < 300) {
                    return response.json();
                } else {
                  throw new Error(`Could not retrieve the ${dataSourceName} dataset; bad response.`);
                }
            })
            .then((data) => {
                if (!data || !data.result || !data.result.records) {
                    displayNotification(`${dataSourceName} records not processed.`, "error", (retryDiv) => {
                        const retryButton = document.createElement("button");
                        retryButton.innerHTML = "<p><i class=\"fa fa-refresh\" aria-hidden=\"true\"></i> Retry</p>";
                        retryButton.type = "button";
                        retryButton.className = "retry";
                        retryButton.addEventListener("click", function() {
                            retryDiv.parentNode.style.display = "none";
                            fetchWPRDCData(dataSourceName);
                        });
                        retryDiv.appendChild(retryButton);
                    });
                    return;
                }

                const records = data.result.records;

                const filterContainer = document.createElement("div");
                filterContainer.className = "typeBtn";

                const filter = document.createElement("input");
                filter.id = dataSourceName.toLowerCase() + "Check";
                filter.type = "checkbox";
                filter.checked = true;

                const filterLabel = document.createElement("label");
                filterLabel.htmlFor = dataSourceName.toLowerCase() + "Check";
                filterLabel.innerHTML = dataSource.icon.options.html + " - " +
                    dataSourceName;

                filter.addEventListener("click", filterDisplay);

                document.getElementById("typeSelection").appendChild(filterContainer);
                filterContainer.appendChild(filter);
                filterContainer.appendChild(filterLabel);

                records.forEach((record, i) => {
                    if (dataSource.processRecord) {
                        dataSource.processRecord(record, i);
                    }

                    //Prune to last 30 days
                    if (record.incidentYear) {
                        if (getDateDifference(currentDate, new Date(record.incidentYear,
                            record.incidentMonth - 1,
                            record.incidentDay)) > 30) {
                                return;
                        }
                    }

                    record.inDate = true;
                    record.type = dataSourceName.toLowerCase();

                    const latLong = dataSource.latLong.map((fieldName) => record[fieldName]);
                    const latLongNoNulls = latLong.some((field) => !!field);

                    if (latLongNoNulls) {
                        const title = dataSource.title(record);
                        record.pin = L.marker(latLong, {
                            title: title,
                            icon: dataSource.icon
                        });

                        record.pin.bindPopup(dataSource.popup(record));
                        record.pin.addTo(map);

                        record.isMapped = true;
                    } else {
                        record.isMapped = false;
                    }
                    markers.push(record);
                });
            })
            .catch((err) => displayNotification(err, "error", (retryDiv) => {
                const retryButton = document.createElement("button");
                retryButton.innerHTML = "<p><i class=\"fa fa-refresh\" aria-hidden=\"true\"></i> Retry</p>";
                retryButton.type = "button";
                retryButton.className = "retry";
                retryButton.addEventListener("click", function() {
                    retryDiv.parentNode.style.display = "none";
                    fetchWPRDCData(dataSourceName);
                });
                retryDiv.appendChild(retryButton);
            }));
    }

    function fetchAllData() {
        Promise.all([
            fetchWPRDCData("Police", { limit: 250 }),
            fetchWPRDCData("311", { limit: 250 }),
            fetchWPRDCData("Arrest", { limit: 250 }),
            fetchWPRDCData("Code Violation", { limit: 250 }),
            fetchWPRDCData("Library"),
            fetchWPRDCData("Non-Traffic Violation", { limit: 250 })
        ]).catch((err) => {
            displayNotification(err, "error", (retryDiv) => {
                var retryButton = document.createElement("button");
                retryButton.innerHTML = "<p><i class=\"fa fa-refresh\" aria-hidden=\"true\"></i> Retry</p>";
                retryButton.type = "button";
                retryButton.className = "retry";
                retryButton.addEventListener("click", function() {
                    retryDiv.parentNode.style.display = "none";
                    fetchAllData();
                });
                retryDiv.appendChild(retryButton);
            });
        });
    }

    fetchAllData();

    //Helper function that returns difference between two dates in days
    function getDateDifference(dateA, dateB) {
        return Math.floor(Math.abs(dateA.getTime() - dateB.getTime()) / 86400000);
    }

})(typeof window !== "undefined" ? window : {});
