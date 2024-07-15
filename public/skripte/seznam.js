// Objekt z zemljevidom
var mapa;

// objekt, ki hrani pot
var pot;
var tockePoti = [];

// Seznam z oznakami na zemljevidu
var markerji = [];

// GPS koordinate FRI
const FRI_LAT = 46.05004;
const FRI_LNG = 14.46931;

// Premakni destinacijo iz seznama (desni del) v košarico (levi del)
const premakniDestinacijoIzSeznamaVKosarico = (id, ime, lat, lng, azuriraj) => {
  if (azuriraj)
    $.get("/kosarica/" + id, (podatki) => {
      /* Dodaj izbrano destinacijo v sejo */
    });

  // Dodaj destnacijo v desni seznam
  $("#kosarica").append(
      "<div id='" +
      id +
      "' class='destinacija'> \
             <button type='button' class='btn btn-light btn-sm'> \
               <i class='fas fa-minus'></i> \
                 <strong><span class='ime' dir='ltr'>" +
      ime +
      "</span></strong> \
            <!--<i class='fas fa-signal'></i>--><span style='display: none' class='lat'>" +
      lat +
      "</span>\
            <!--<i class='far fa-clock'></i>--><span class='lng' style='display: none'>" +
      lng +
      "</span><!-- min -->\
              </button> \
                <input type='button' onclick='podrobnostiDestinacije(" +
      id +
      ")' class='btn btn-secondary btn-sm' value='...'> \
              </div>"
  );

  // Dogodek ob kliku na destinacijo v košarici (na desnem seznamu)
  $("#kosarica #" + id + " button").click(function () {
    let destinacija_kosarica = $(this);
    $.get("/kosarica/" + id, (podatki) => {
      /* Odstrani izbrano destinacijo iz seje */
      // Če je košarica prazna, onemogoči gumbe za pripravo računa
      if (!podatki || podatki.length == 0) {
        $("#racun_html").prop("disabled", true);
        $("#racun_xml").prop("disabled", true);
      }
    });
    // Izbriši destinacijo iz desnega seznama
    destinacija_kosarica.parent().remove();

    // Pokaži destinacijo v levem seznamu
    $("#destinacije #" + id).show();
  });

  // Skrij destinacijo v levem seznamu
  $("#destinacije #" + id).hide();
  // Ker košarica ni prazna, omogoči gumbe za pripravo računa
  $("#racun_html").prop("disabled", false);
  $("#racun_xml").prop("disabled", false);
};

// Vrni več podrobnosti destinacije
const podrobnostiDestinacije = (id) => {
  $.get("/vec-o-destinaciji-api/" + id, (podatki) => {
    if (typeof podatki === "string" && podatki.includes("napaka")) {
      $("#sporocilo").html(
          "<div class='alert alert-danger'>" +
          "Podatki niso na voljo" +
          "</div>"
      );
    } else {
      let naslov = "";
      let naslovneLastnosti = podatki.address.map((item) => item.localname);

      if (naslovneLastnosti.length > 0) {
        naslov = naslovneLastnosti.filter(Boolean).join(", ");
      }

      const url = podatki.extratags.website;
      const datum = podatki.indexed_date;

      $("#sporocilo").html(
          "<div class='alert alert-info'>" +
          "<strong>Naslov:</strong> " + naslov + "<br>" +
          "<strong>URL naslov:</strong> " + (url ? "<a href='" + url + "'>" + url + "</a>" : "Ni na voljo") + "<br>" +
          "<strong>Datum vnosa:</strong> " + datum +
          "</div>"
      );
    }
  });
};


function prikazPoti() {
  // Izbrišemo obstoječo pot, če ta obstaja
  if (pot != null) mapa.removeControl(pot);

  // Dodamo pot
  pot = L.Routing.control({
    waypoints: tockePoti,
    lineOptions: {
      styles: [
        {
          color: "#4E732E", // Barva poti
          opacity: 1, // Prosojnost poti
          weight: 5, // Debelina poti
          dashArray: "4.75" // Črtkana črta s razmakom 4.75
        }
      ]
    },
    router: new L.Routing.osrmv1({
      routeWhileDragging: true
    }),
    show: false, // Pot je privzeto minimizirana
  });
  pot.addTo(mapa);
  // podrobnosti o poti, ko je ta najdena
  pot.on("routesfound", function (e) {
    koordinateIzbranePoti = e.routes[0].coordinates;
  });

}

$(document).ready(() => {
  // Osnovne lastnosti mape
  var mapOptions = {
    center: [FRI_LAT, FRI_LNG],
    zoom: 7.5,
  };

  // Ustvarimo objekt mapa
  mapa = new L.map("mapa_id", mapOptions);

  // Ustvarimo prikazni sloj mape
  var layer = new L.TileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  );

  // Prikazni sloj dodamo na mapo
  mapa.addLayer(layer);


  // Ročno dodamo FRI na mapo
  dodajMarker(
      FRI_LAT,
      FRI_LNG,
      "Fakulteta za računalništvo in informatiko",
      "yellow"
  );


  // Posodobi podatke iz košarice na spletni strani
  $.get("/kosarica", (kosarica) => {
    kosarica.forEach((destinacija) => {
      premakniDestinacijoIzSeznamaVKosarico(
          destinacija.id,
          destinacija.ime,
          destinacija.zemljepisnaSirina,
          destinacija.zemljepisnaDolzina,
          false
      );
    });
  });

  // Klik na destinacijo v levem seznamu sproži
  // dodajanje destinacije v desni seznam (košarica)
  $("#destinacije .destinacija button").click(function () {
    let destinacija = $(this);
    premakniDestinacijoIzSeznamaVKosarico(
        destinacija.parent().attr("id"),
        destinacija.find(".ime").text(),
        destinacija.find(".lat").text(),
        destinacija.find(".lng").text(),
        true
    );
    dodajMarker(
        parseFloat(destinacija.find(".lat").text()),
        parseFloat(destinacija.find(".lng").text()),
        destinacija.find(".ime").text(),
        "blue"
    );
    let lat = parseFloat(destinacija.find(".lat").text());
    let lng = parseFloat(destinacija.find(".lng").text());
    tockePoti.push(L.latLng(lat, lng));
    console.log(tockePoti);
    prikazPoti();

  });

  // Klik na gumba za pripravo računov
  $("#racun_html").click(() => (window.location = "/izpisiRacun/html"));
  $("#racun_xml").click(() => (window.location = "/izpisiRacun/xml"));
});

/**
 * Dodaj izbrano oznako na zemljevid na določenih GPS koordinatah,
 * z dodatnim opisom, ki se prikaže v oblačku ob kliku in barvo
 * ikone, glede na tip oznake (FRI = črna, parki = zelena in
 * hoteli = modra)
 *
 * @param lat zemljepisna širina
 * @param lng zemljepisna dolžina
 * @param vsebinaHTML, vsebina v HTML obliki ki se prikaže v oblačku
 * @param barvaAnglesko, barva navedena v angleškem jeziku (npr. green, blue, black)
 */
function dodajMarker(lat, lng, vsebinaHTML, barvaAnglesko) {
  var streznik = "https://teaching.lavbic.net/cdn/OIS/DN/";
  var ikona = new L.Icon({
    iconUrl: streznik + "marker-icon-2x-" + barvaAnglesko + ".png",
    shadowUrl: streznik + "marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Ustvarimo marker z vhodnima podatkoma koordinat
  // in barvo ikone, glede na tip
  var marker = L.marker([lat, lng], { icon: ikona });

  // Izpišemo želeno sporočilo v oblaček
  marker.bindPopup(vsebinaHTML).openPopup();

  marker.addTo(mapa);
  markerji.push(marker);
}