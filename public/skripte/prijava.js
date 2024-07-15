$(document).ready(() => {
  $("select#seznamRacunov").change(function (e) {
    let izbranRacunId = $(this).val();
// Uporabi AJAX klic za pridobitev podrobnosti računa
    $.ajax({
      url: "/destinacije-racuna/" + izbranRacunId,
      success: function (response) {
        // Izračunaj skupno ceno in najdražjo destinacijo
        let skupnaCena = 0;
        let najvisjaCena = 0;
        var najdrazjaDestinacija='';
        response.forEach((destinacija) => {
          skupnaCena += destinacija.cena;
          if (destinacija.cena > najvisjaCena) {
            najvisjaCena = destinacija.cena;
            najdrazjaDestinacija = destinacija.ime;
          }

        });
        // Izpiši rezultate v HTML elementu
        let skupnaCenaIzleta = $("#skupnaCenaIzleta");
        skupnaCenaIzleta.html(
            "Skupna cena izleta znaša " +
            skupnaCena.toFixed(2) +
            " €, pri čemer je najdražja destinacija " +
            najdrazjaDestinacija +
            "."
        );
      },
      error: function (error) {
        console.log(error);
      },

    });

  });
  $('#iskalniNiz').keyup(function() {
    var iskalniNiz = $(this).val().toLowerCase();
    $('#seznamRacunov option').each(function() {
      var optionText = $(this).text().toLowerCase();
      if (optionText.indexOf(iskalniNiz) > -1) {
        $(this).css('background-color', 'linen');
      } else {
        $(this).css('background-color', '');
      }
    });
  });
});
$(document).ready(function() {
$("#locationDropdown").val("ljubljana");
$("#latitude").val("46.050193");
$("#longitude").val("14.46891");
document.getElementById("locationDropdown").addEventListener("change", function() {
  const selectedLocation = this.value;
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");

  if (selectedLocation === "ljubljana") {
    latInput.value = 46.050193;
    lngInput.value = 14.46891;
  } else if (selectedLocation === "maribor") {
    latInput.value = 46.558333;
    lngInput.value = 15.651389;
  }else if (selectedLocation === "celje") {
    latInput.value = 46.239751;
    lngInput.value = 15.267706;
  }
});
let chart;

function isciDediscine() {
  const latitude = document.getElementById('latitude').value;
  const longitude = document.getElementById('longitude').value;

  const url = `https://teaching.lavbic.net/api/kulturneDediscine/iskanje/lokacija?lat=${latitude}&lng=${longitude}&razdalja=20`;

  fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Heritage data:', data);
        prikazDediscine(data);
      })
      .catch(error => {
        console.error('An error occurred while fetching the data:', error);
      });
}

function prikazDediscine(data) {
  const chartData = [
    { type: "sakralna stavbna dediščina", count: 0 },
    { type: "memorialna dediščina", count: 0 },
    { type: "profana stavbna dediščina", count: 0 }
  ];

  // Count the occurrences of each type
  data.forEach(item => {
    if (item.Tip === "sakralna stavbna dediščina") {
      chartData[0].count++;
    } else if (item.Tip === "memorialna dediščina") {
      chartData[1].count++;
    } else if (item.Tip === "profana stavbna dediščina") {
      chartData[2].count++;
    }
  });

  const chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: "Tipi dediščina"
    },
    data: [{
      type: "pie",
      showInLegend: true,
      legendText: "{label}",
      toolTipContent: "{label}: {y}",
      indexLabel: "{label} - {y}",
      dataPoints: chartData.map(item => ({ label: item.type, y: item.count }))
    }]
  });

  chart.render();
}



// dodamo eventListener na gumb

const gumbDediscine = document.querySelector("button[type='submit']");
gumbDediscine.addEventListener("click", (event) => {
  event.preventDefault(); // Prevent default form submission
  isciDediscine();
});
});
const SENSEI_RACUN = "0xF7F89969250E6A8cAa2C61AC76049c3AF412C9e3";
let web3;
const donirajEthereum = async (modalnoOknoDoniraj) => {
  try {
    var posiljateljDenarnica = $("#eth-racun").attr("denarnica");
    var prejemnikDenarnica = $("#denarnica-prejemnika").val();

    let rezultat = await web3.eth.sendTransaction({
      from: posiljateljDenarnica,
      to: prejemnikDenarnica,
      value: 0.1 * Math.pow(10, 18),
    });

    // ob uspešni transakciji
    if (rezultat) {
      modalnoOknoDoniraj.hide();
    } else {
      // neuspešna transakcija
      $("#napakaDonacija").html(
          "<div class='alert alert-danger' role='alert'>" +
          "<i class='fas fa-exclamation-triangle me-2'></i>" +
          "Prišlo je do napake pri transakciji!" +
          "</div>"
      );
    }
  } catch (e) {
    // napaka pri transakciji
    $("#napakaDonacija").html(
        "<div class='alert alert-danger' role='alert'>" +
        "<i class='fas fa-exclamation-triangle me-2'></i>" +
        "Prišlo je do napake pri transakciji: " + e +
        "</div>"
    );
  }
};

/**
 * Funkcija za prikaz donacij v tabeli
 */
const dopolniTabeloDonacij = async () => {
  try {
    let steviloBlokov = (await web3.eth.getBlock("latest")).number;
    let st = 1;
    $("#seznam-donacij").html("");
    for (let i = 0; i <= steviloBlokov; i++) {
      let blok = await web3.eth.getBlock(i);


      for (let txHash of blok.transactions) {
        let tx = await web3.eth.getTransaction(txHash);
        if (!prijavljenRacun || prijavljenRacun == tx.from) {
          $("#seznam-donacij").append("\
                    <tr>\
                        <th scope='row'>" + st++ + "</th>\
                        <td>" + okrajsajNaslov(tx.hash) + "</td>\
                        <td>" + okrajsajNaslov(tx.from) + "</td>\
                        <td>" + okrajsajNaslov(tx.to) + "</td>\
                        <td>" + parseFloat(web3.utils.fromWei(tx.value)) + " <i class='fa-brands fa-ethereum'></i></td>\
                    </tr>");
        }
      }
    }
  } catch (e) {
    alert(e);
  }
};

function okrajsajNaslov(vrednost) {
  return vrednost.substring(0, 4) + "..." + vrednost.substring(vrednost.length - 3, vrednost.length);
}

/**
 * Funkcija za prijavo Ethereum denarnice v testno omrežje
 */
const prijavaEthereumDenarnice = async (modalnoOknoPrijava) => {
  try {
    let rezultat = await web3.eth.personal.unlockAccount(
        $("#denarnica").val(),
        $("#geslo").val(),
        300);

    // ob uspešni prijavi računa
    if (rezultat) {
      prijavljenRacun = $("#denarnica").val();
      $("#eth-racun").html(okrajsajNaslov($("denarnica").val()) + " (5 min)");
      $("#eth-racun").attr("denarnica", $("#denarnica").val());
      $("#gumb-doniraj-start").removeAttr("disabled");
      modalnoOknoPrijava.hide();
    } else {
      // neuspešna prijava računa
      $("#napakaPrijava").html(
          "<div class='alert alert-danger' role='alert'>" +
          "<i class='fas fa-exclamation-triangle me-2'></i>" +
          "Prišlo je do napake pri odklepanju!" +
          "</div>"
      );
    }
  } catch (napaka) {
    // napaka pri prijavi računa
    $("#napakaPrijava").html(
        "<div class='alert alert-danger' role='alert'>" +
        "<i class='fas fa-exclamation-triangle me-2'></i>" +
        "Prišlo je do napake pri odklepanju: " + napaka +
        "</div>"
    );

  }
};

/**
 * Funkcija za dodajanje poslušalcev modalnih oken
 */
function poslusalciModalnaOkna() {
  const modalnoOknoPrijava = new bootstrap.Modal(document.getElementById('modalno-okno-prijava'), {
    backdrop: 'static'
  });

  const modalnoOknoDoniraj = new bootstrap.Modal(document.getElementById('modalno-okno-donacije'), {
    backdrop: 'static'
  });

  $("#denarnica,#geslo").keyup(function (e) {
    if ($("#denarnica").val().length > 0 && $("#geslo").val().length > 0)
      $("#gumb-potrdi-prijavo").removeAttr("disabled");
    else
      $("#gumb-potrdi-prijavo").attr("disabled", "disabled");
  });

  $("#gumb-potrdi-prijavo").click(function (e) {
    prijavaEthereumDenarnice(modalnoOknoPrijava);
  });

  $("#potrdi-donacijo").click(function (e) {
    donirajEthereum(modalnoOknoDoniraj);
  });

  var modalnoOknoDonacije = document.getElementById('modalno-okno-donacije');
  modalnoOknoDonacije.addEventListener('show.bs.modal', function (event) {
    var prijavljenaDenarnica = $("#eth-racun").attr("denarnica");
    $("#posiljatelj").text(prijavljenaDenarnica);
  });

  var modalnoOknoSeznamDonacij = document.getElementById('modalno-okno-seznam-donacij');
  modalnoOknoSeznamDonacij.addEventListener('show.bs.modal', function (event) {
    dopolniTabeloDonacij();
  });
}


$(document).ready(function () {
  $("#sporocila").html("");

  /* Povežemo se na testno Ethereum verigo blokov */
  web3 = new Web3("https://sensei.lavbic.net:8546");

  /* Dodamo poslušalce */

});