import data from "./data.mjs"

const STOPS = [];
data.forEach((elem) => {
  for (let i = 1; i < elem.features.length; i++) {
    if (
      elem.features[i].properties.hasOwnProperty("stop_name") &&
      !STOPS.some(
        (stop) =>
          stop.properties.stop_name === elem.features[i].properties.stop_name
      )
    ) {
      STOPS.push(elem.features[i]);
    }
  }
});
STOPS.sort((a, b) => {
  let aStr = a.properties.stop_name;
  let bStr = b.properties.stop_name;
  if (aStr < bStr) {
    return -1;
  }
  if (aStr > bStr) {
    return 1;
  }
  return 0;
});
class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchValue: "",
      matches: []
    };
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(event) {
    this.setState({
      searchValue: event.target.value
    });
    let newMatches = [];
    let searchTerm = event.target.value.toLowerCase();
    STOPS.forEach((elem) => {
      if (elem.properties.stop_name.toLowerCase().includes(searchTerm)) {
        newMatches.push(elem);
      }
    });
    this.setState({
      matches: newMatches
    });
  }
  render() {
    let index = 0;
    return /*#__PURE__*/ React.createElement(
      "div",
      null,
      /*#__PURE__*/ React.createElement("input", {
        type: "search",
        value: this.state.searchValue,
        onChange: this.handleChange
      }),
      /*#__PURE__*/ React.createElement(
        "div",
        null,
        this.state.searchValue.length > 0 &&
          this.state.matches.length >= 100 &&
          /*#__PURE__*/ React.createElement(
            "div",
            null,
            "Your search returned too many matches to display. Try typing more characters."
          ),
        this.state.matches.length > 0 &&
          this.state.matches.length < 100 &&
          /*#__PURE__*/ React.createElement(
            "div",
            null,
            /*#__PURE__*/ React.createElement(
              "div",
              null,
              "Your search returned ",
              this.state.matches.length +
                " " +
                (this.state.matches.length > 1 ? "matches" : "match"),
              ". Click on a match to see where it is located."
            ),
            /*#__PURE__*/ React.createElement(
              "div",
              {
                id: "match-container"
              },
              this.state.matches.map((elem) =>
                /*#__PURE__*/ React.createElement(
                  "div",
                  {
                    className: "match",
                    key: index++,
                    onClick: this.props.updateSelected(elem)
                  },
                  elem.properties.stop_name
                )
              )
            )
          ),
        this.state.searchValue.length === 0 &&
          /*#__PURE__*/ React.createElement(
            "div",
            null,
            "Search for a stop using the box above."
          ),
        this.state.matches.length === 0 &&
          this.state.searchValue.length > 0 &&
          /*#__PURE__*/ React.createElement(
            "div",
            null,
            "There are no matches for your search."
          )
      )
    );
  }
}
class MapView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      markers: undefined,
      searchMarker: undefined,
      mapObject: undefined
    };
  }
  componentDidMount() {
    const map = L.map("map").setView([43.4565, -80.5092], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    data.forEach((elem) => {
      let path = L.geoJSON(elem, {
        pointToLayer: function (point, latlng) {},
        style: function (feature) {
          return {
            weight: 3,
            color: elem.features[0].properties.route_color,
            opacity: 0.2
          };
        }
      }).addTo(map);
      let t = this;
      path.on("mouseover", function (e) {
        L.popup()
          .setLatLng(e.latlng)
          .setContent(
            elem.features[0].properties.route_long_name +
              "(Route " +
              elem.features[0].properties.route_short_name +
              ")"
          )
          .openOn(map);
      });
      path.on("click", function (e) {
        let newMarkers = L.geoJson(elem, {
          style: function (feature) {
            return {
              weight: 3,
              color: elem.features[0].properties.route_color,
              opacity: 1
            };
          }
        });
        if (t.state.markers !== undefined) {
          map.removeLayer(t.state.markers);
        }
        t.setState({
          markers: newMarkers
        });
        newMarkers.addTo(map);

        if(this.state.searchMarker !== undefined){
          map.removeLayer(this.state.searchMarker);
          this.state.searchMarker = undefined;
        }
      });
    });
    this.setState({
      mapObject: map
    });
  }
  componentDidUpdate() {
    //props.sp undefined and state.sm undefined: path
    //props.sp defined and state.sm undefined: path overriding
    if (this.props.selectedPoint !== undefined) {
      let coords = this.props.selectedPoint.geometry.coordinates;
      if (this.state.searchMarker !== undefined) {
        this.state.mapObject.removeLayer(this.state.searchMarker);
      }
      if(this.state.searchMarker !== undefined || this.state.markers === undefined){
        this.state.mapObject.setView([coords[1], coords[0]], 15);
      }

      let routeString = this.props.selectedPoint.properties.routes.map(
        elem => elem.route_long_name + ' (' + elem.route_short_name + ')'
        ).join('<br/>');

      routeString = 'Routes:<br/>' + routeString;

        console.log(routeString);

      let newMarker = L.marker([coords[1], coords[0]]).bindPopup(routeString).addTo(this.state.mapObject);
      newMarker.openPopup();
      this.state.searchMarker = newMarker;
    }
  }

  render() {
    return /*#__PURE__*/ React.createElement("div", {
      id: "map"
    });
  }
}
class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMarker: undefined
    };
    this.updateCurrentMarker = this.updateCurrentMarker.bind(this);
  }
  updateCurrentMarker(newMarker) {
    return () => {
      this.setState({
        marker: newMarker
      });
    };
  }
  render() {
    return /*#__PURE__*/ React.createElement(
      "div",
      {
        id: "page"
      },
      /*#__PURE__*/ React.createElement(
        "header",
        null,
        /*#__PURE__*/ React.createElement(
          "h1",
          null,
          "Region of Waterloo Transit"
        )
      ),
      /*#__PURE__*/ React.createElement(
        "main",
        null,
        /*#__PURE__*/ React.createElement(
          "p",
          null,
          "Hover over a route to see its name and number. Click on a route to see all of its stops."
        ),
        /*#__PURE__*/ React.createElement(
          "div",
          {
            id: "map-search-grid"
          },
          /*#__PURE__*/ React.createElement(MapView, {
            selectedPoint: this.state.marker
          }),
          /*#__PURE__*/ React.createElement(Search, {
            updateSelected: this.updateCurrentMarker
          })
        )
      )
    );
  }
}
const domContainer = document.querySelector("#root");
const root = ReactDOM.createRoot(domContainer);
root.render(/*#__PURE__*/ React.createElement(Page, null));
