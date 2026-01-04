# Flights Mapper

An interactive flight visualizer with a custom Domain Specific Language (DSL) for defining trips.

## Features

✈️ **Custom DSL** - Define trips using an intuitive syntax
🗺️ **Interactive Map** - Visualize flight routes on a world map using Plotly
📝 **Live Editing** - See routes update in real-time as you type
🎨 **Custom Colors** - Assign colors to different trips
🏷️ **Trip Metadata** - Add tags and additional information to trips
✅ **Validation** - Real-time parsing with error feedback

## DSL Syntax

```
// Comment lines start with //
trip(
  name="Trip Name",
  stops=["SFO", "JFK", "CPH"],  // IATA airport codes
  from="Jan 1 2024",            // Natural language dates
  to="Jan 5 2024",
  tags=["vacation", "europe"],  // Optional tags
  color="blue"                  // Optional color for route visualization
)
```

### Example

```
trip(
  name="Copenhagen Adventure",
  stops=["SFO", "JFK", "CPH"],
  from="Jan 1 2024",
  to="Jan 5 2024",
  tags=["vacation", "europe"],
  color="blue"
)

trip(
  name="European Tour",
  stops=["SFO", "LHR", "CDG", "FCO", "SFO"],
  from="Jun 1 2024",
  to="Jun 15 2024",
  tags=["vacation", "multi-city"],
  color="purple"
)
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Generate Langium grammar
npm run langium:generate
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main visualizer page
│   └── globals.css          # Global styles
│
├── components/              # React components
│   ├── Editor/
│   │   └── CodeEditor.tsx  # Code editor component
│   └── Visualizer/
│       └── PlotlyMap.tsx   # Plotly visualization component
│
├── langium/                 # Langium DSL definition
│   ├── trip-dsl.langium    # Grammar file
│   └── generated/          # Auto-generated files
│
├── services/                # Business logic
│   ├── airportService.ts   # Airport data management
│   ├── dslParser.ts        # DSL parsing
│   ├── tripConverter.ts    # Trip to route conversion
│   └── langiumServices.ts  # Langium service configuration
│
├── types/                   # TypeScript types
│   ├── airport.ts
│   └── trip.ts
│
└── public/
    └── data/
        └── airports.dat    # Airport database (7,698 airports)
```

## Technical Stack

- **Next.js 16** - React framework with App Router
- **Langium 4** - DSL grammar and parser
- **Plotly.js** - Interactive map visualization
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## How It Works

1. **DSL Parsing**: User types trip definitions in the custom DSL
2. **Langium Processing**: Grammar parses the text into an Abstract Syntax Tree (AST)
3. **Trip Conversion**: AST is converted to Trip objects
4. **Route Generation**: Trips are converted to route pairs (src → dest)
5. **Coordinate Lookup**: Airport IATA codes are matched with lat/long coordinates from airports.dat
6. **Visualization**: Plotly renders routes as Scattergeo traces on a world map

## Airport Database

The project includes a database of 7,698 airports from [OpenFlights](https://openflights.org/data.html).

Each airport includes:
- IATA code (e.g., SFO, JFK, LHR)
- Name, city, country
- Latitude and longitude coordinates
- Altitude, timezone information

## Future Enhancements

Planned features for future versions:

- 🎬 **Animation** - Timeline playback showing flights over time
- ✨ **Monaco Editor** - VS Code-like editor with syntax highlighting and autocomplete
- 🔍 **Airport Search** - Auto-complete suggestions while typing IATA codes
- ✅ **Advanced Validation** - Check for invalid airport codes and date formats
- 📱 **Mobile Support** - Responsive design for mobile devices
- 💾 **Save/Load** - Persist trip definitions locally or to the cloud
- 📊 **Statistics** - Show total distance, flight count, countries visited

## Credits

- Airport data from [OpenFlights](https://openflights.org/data.html)
- Visualization inspired by Python Jupyter notebook experiments
- Built with [Langium](https://langium.org/) for DSL parsing
- Map visualization powered by [Plotly.js](https://plotly.com/javascript/)

## License

ISC

---

**Flights Mapper** - Turn your travel plans into beautiful visualizations ✈️🗺️
