// Kultura Meta Search
// configuration file
// it is currently evalled in the global context, so no monkey business
// TODO: at least sandbox, or figure out how to parse non-strict json
{	
	// all sources will be templated against this
	// i.e. they will get all values from here, overriden by values defined per source
	// {{{id}}} gets replaced with source id
	source_template: {
		host: 'services.ljudmila.net',
		port: 80,
		path: '/scrapers/{{{id}}}.php'
	},
	sources: {
		sigledal_repertoar: {
			name: 	"SiGledal",
			home: 	"http://www.sigledal.si",
		},
		situla: {
			name: 	"RKD Situla",
			home: 	"http://www.sigledal.si",
		},
		kamra: {
			name: 	"Kamra",
			home: 	"http://www.kamra.si",
		},
		cobiss_knjige: {
			name: 	"Cobiss",
			home: 	"http://www.cobiss.si",
		},
		dlib: {
			name: 	"dlib",
			home: 	"http://dlib.si",
		},
		dlib_fotografije: {
			name: 	"dlib",
			home: 	"http://dlib.si",
		},
		dlib_artoteka: {
			name: 	"dlib",
			home: 	"http://dlib.si",
		},
		sl_wiki: {
			name: 	"wikipedija",
			home: 	"http://sl.wikipedia.org",
		}
	},
	paths: {
		"/": {
			file: "client/index.html",
			type: "text/html"
		},
		"/jq.js": {
			file: "client/jq.js",
			type: "application/javascript"
		},
		"/kultura.js": {
			file: "client/kultura-client.js",
			type: "application/javascript"
		},
		"/kultura.css": {
			file: "client/kultura.css",
			type: "text/css"
		}
	},
	io: {
		transports: ["xhr-polling"]
	}
}
