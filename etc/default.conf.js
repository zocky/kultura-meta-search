{	
	defaultSource: {
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
			file: "static/index.html",
			type: "text/html"
		},
		"/jq.js": {
			file: "static/jq.js",
			type: "application/javascript"
		},
		"/kultura.js": {
			file: "static/kultura.js",
			type: "application/javascript"
		},
		"/kultura.css": {
			file: "static/kultura.css",
			type: "text/css"
		}
	},
	io: {
		transports: ["xhr-polling"]
	}
}
