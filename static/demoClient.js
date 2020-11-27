//creation of Vue instance to broadcast events to granparent components

var eventBus = new Vue();

  function logData(message) {
      var d = new Date();
      var time = '[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ';
      console.log(time + message);
  }

  //first level of hierarchy that contains the rooms
  Vue.component('floormap', {
      props: {
          rooms: {
              type: Array,
              required: true
          },
          ranges: {
              type: Array,
              required: true
          }
      },
      template: `
        <div class="floormap">

            <room :room="room" :ranges="ranges" v-for="(room, index) in rooms" :key="room.roomId"></room>

        </div>
       `,
      data() {
          return {

          }
      }
  })
  //created in floormap template
  Vue.component('room', {
      props: {
          room: {
              type: Object,
              required: true
          },
          ranges: {
              type: Array,
              required: true
          }
      },
      template: `
        <div class="room" v-on:mouseover="onMouseover(room.roomId)" v-on:mouseout="onMouseout()">

            <div class="roomLabel">{{ room.roomNo }}</div>
            <vitals v-if="room.patient.patientName" :vitals="room.patient.vitals" :vitalChange="room.patient.changedVital" :alertStatus="room.patient.alert" :ranges="ranges"></vitals>

        </div>
       `,
      data() {
          return {

          }
      },
      methods: {
          onMouseover(id) {
              if (this.room.patient.patientName) {
                  eventBus.$emit('set-active', id);
              }
          },
          onMouseout() {
              eventBus.$emit('reset-active');
          }
      }
  })

  //created from room template, displays the 3 vitals that are on the room on the dashboard
  Vue.component('vitals', {
      props: {
          vitals: {
              type: Object,
              required: true
          },
          vitalChange: {
              type: Object,
              required: true
          },
          alertStatus:{
              type: Object,
              required:true
          },
          ranges: {
              type: Array,
              required: true
          }
      },

      //Watcher that indicates which vital has changed and the new number
      watch: {
          vitalChange: function (newVal,oldVal) {
              this.setAlert(newVal);
              this.setUpdated(newVal.vital.toLowerCase());
          },
          deep:true
      },
      template: `
        <div class="vitals">

            <div class="hr" :class="{ alert: alertStatus.status }"></div>

            <div class="burden">
                <div class="tag">Burden</div>
                <div class="rate" :class="{ changed: burdenChange, alert: burdenAlert }">{{ vitals.Burden }}</div>
                <div class="measure"></div>
            </div>

            <div class="icp">
                <div class="tag">ICP</div>
                <div class="rate" :class="{ changed: icpChange, alert: icpAlert }">{{ vitals.ICP }}</div>
                <div class="measure">mmHg</div>
            </div>

            <div class="pbto2">
                <div class="tag">PbtO<sub>2</sub></div>
                <div class="rate" :class="{ changed: pbto2Change, alert: pbto2Alert }">{{ vitals.PbtO2 }}</div>
                <div class="measure">mmHg</div>
            </div>

        </div>
       `,
      data() {
          return {
              burdenChange: false,
              icpChange: false,
              pbto2Change: false,
              burdenAlert: false,
              icpAlert: false,
              pbto2Alert: false
          }
      },
      methods: {
          //will set alert based on ranges that are passed in as a prop
          setAlert(updatedVital) {
              for(var ra=0; ra<this.ranges.length; ra++) {
                  if(this.ranges[ra].vitalName === updatedVital.vital) {
                      if(updatedVital.val > this.ranges[ra].vals.max || updatedVital.val < this.ranges[ra].vals.min) {
                          /* suppress alerts for now */
                          this[updatedVital.vital.toLowerCase()+'Alert'] = true;
                          /*setTimeout(function() {
                              this[updatedVital.vital.toLowerCase()+'Alert'] = false;
                          }.bind(this), 5000);
                          */
                      }
                      else {
                          this[updatedVital.vital.toLowerCase()+'Alert'] = false;
                      }
                  }
              }
          },
          //will set new class if metric has changed allowing number to flicker on dashboard
          setUpdated(vitalName){
              if(this.hasOwnProperty([vitalName+'Change'])) {
                  /* stop flickering for now */
                  this[vitalName+'Change'] = false;
                  setTimeout(function() {
                      this[vitalName+'Change'] = false;
                  }.bind(this), 500);
              }
          }
      }
  })

  //creation of patient list displayed on the side
  //props passed in from index.html
  Vue.component('patientlist', {
      props: {
          rooms: {
              type: Array,
              required: true
          },
          active: {
              type: Number,
              required: true
          }
      },
      template: `
        <div class="patientlist">

            <div class="listhead"><div class="roomNo">Room</div><div class="patientName">Patient</div></div>
            <patient :room="room" :active="active" v-for="(room, index) in rooms" :key="room.roomId"></patient>

        </div>
       `,
      data() {
          return {

          }
      }
  })

//patient inherits props from patient list which allows for mouseover on patient list
  Vue.component('patient', {
      props: {
          room: {
              type: Object,
              required: true
          },
          active: {
              type: Number,
              required: true
          }
      },
      template: `
        <div class="patient" :class="{ alert: room.patient.alert.status }" v-on:mouseover="onMouseover(room.roomId)"  v-on:mouseout="onMouseout()">

            <div class="roomNo">{{ room.roomNo }}</div><div class="patientName">{{ room.patient.patientName }}</div>

        </div>
       `,
      data() {
          return {

          }
      },
      //methods that allow the revealing of patient vitals when the patient name is hovered over
      //event bus allows for the emission of events to the grandparent
      //signals are handled in the overall vue instance (bottom of the code)
      methods: {
          onMouseover(id) {
              if (this.room.patient.patientName) {
                  eventBus.$emit('set-active', id);
              }
          },
          onMouseout() {
              eventBus.$emit('reset-active');
          }
      }
  })

//start of 3rd hierarchy that allows for the display of the vital cards that is displayed in the center on mouseover
  Vue.component('cards', {
    //props that are passed in through station.html
      props: {
          rooms: { //array of all rooms with patient info
              type: Array,
              required: true
          },
          active: { //indicates if card is shown or not
              type: Number,
              required: true
          },
          ranges: { //ranges for each vital that is being monitored
              type: Array,
              required: true
          }
      },

    //iterate through each room in the rooms array and create all the cards that will display the patient vitals
    //created within the cards class in the template
      template: `
        <div class="cards" :class="isActive">

            <card :room="room" :active="active" :ranges="ranges" v-for="(room, index) in rooms" :key="room.roomId"></card>

        </div>
       `,
      data() {
          return {

          }
      },
      computed: {
          isActive: function () {
              return {
                  active: this.active !== 999
              }
          }
      }
  })

  //card component that is passed props from cards and creates the patient card
  //allows for the display of the alert on the card when vital is out of range
  Vue.component('card', {
      props: {
          room: {
              type: Object,
              required: true
          },
          active: {
              type: Number,
              required: true
          },
          ranges: {
              type: Array,
              required: true
          }
      },
      template: `
        <div :id="room.roomId" class="card" :class="isActive">

            <div class="roomInfo">
                <div class="riRow"><div class="riLabel">Room</div><div class="riValue">{{ room.roomNo }}</div></div>
            </div>
            <div class="condition" :class="{ alert: room.patient.alert.status }"></div>

            <patientCard :patient="room.patient" :ranges="ranges"></patientCard>

        </div>
       `,
      data() {
          return {

          }
      },
      computed: {
          isActive: function () {
              return {
                  active: this.room.roomId === this.active
              }
          }
      }
  })

//creation of patientCard component - > allows for the passing of patient information into the vitals card that will display all patient vitals
  Vue.component('patientCard', {
      props: {
          patient: {
              type: Object,
              required: true
          },
          ranges: {
              type: Array,
              required: true
          }
      },
      template: `
        <div class="patientCard">

            <div class="patientInfo">
                <div class="piRow"><div class="piLabel">Name</div><div class="piValue">{{ patient.patientName }}</div></div>
            </div>
            <vitalsCard :patientId="patient.patientId" :vitals="patient.vitals" :changedVital="patient.changedVital" :ranges="ranges"></vitalsCard>

        </div>
       `,
      data() {
          return {

          }
      }
  })

//props passed in from patient card, where bulk of patient information is extracted and metrics are calculated and displayed
  Vue.component('vitalsCard', {
      props: {
          patientId: {
              type: String,
              required: true
          },
          vitals: {
              type: Object,
              required: true
          },
          changedVital: {
              type: Object,
              required: true
          },
          ranges: {
              type: Array,
              required: true
          }
      },
      watch: {
          changedVital: function(newVal, oldVal) {
              this.setAlert(newVal);
              this.setUpdate(newVal.vital.toLowerCase());
          },
          deep:true
      },
      template: `
        <div class="vitalsCard">

            <div class="vital hr">
                <div class="tag">HR</div>
                <div class="rate" :class="{ changed: hrChange, alert: hrAlert }">{{ vitals.HR }}</div>
                <div class="measure pulse">bpm</div>
                <div class="label" :class="{ changed: hrChange, alert: hrAlert }">HR</div>
            </div>
            <div class="vital rr">
                <div class="tag">RR</div>
                <div class="rate" :class="{ changed: rrChange, alert: rrAlert }">{{ vitals.RR }}</div>
                <div class="measure">bpm</div>
                <div class="label" :class="{ changed: rrChange, alert: rrAlert }">Resp</div>
            </div>
            <div class="vital bp">
                <div class="tag">ABP</div>
                <div class="rate"><span class="syst" :class="{ changed: systChange, alert: systAlert }">{{ vitals.ABPSyst }}</span>/<span class="dias" :class="{ changed: diasChange, alert: diasAlert }">{{ vitals.ABPDias }}</span></div>
                <div class="measure"><span class="mean" :class="{ changed: meanChange, alert: meanAlert }">({{ vitals.ABPMean }})</span>mmHg</div>
                <div class="label" :class="{ changed: systChange, dchanged: diasChange, mchanged: meanChange, alert: systAlert, dalert: diasAlert, malert: meanAlert }">ABP</div>
            </div>
            <div class="vital etco2">
                <div class="tag">EtCO<sub>2</sub></div>
                <div class="rate" :class="{ changed: etco2Change, alert: etco2Alert }">{{ vitals.EtCO2 }}</div>
                <div class="measure">mmHg</div>
                <div class="label" :class="{ changed: etco2Change, alert: etco2Alert }">EtCO<sub>2</sub></div>
            </div>
            <div class="vital icp">
                <div class="tag">ICP</div>
                <div class="rate" :class="{ changed: icpChange, alert: icpAlert }">{{ vitals.ICP }}</div>
                <div class="measure">mmHg</div>
                <div class="label" :class="{ changed: icpChange, alert: icpAlert }">ICP</div>
            </div>
            <div class="vital cpp">
                <div class="tag">CPP</div>
                <div class="rate" :class="{ changed: cppChange, alert: cppAlert }">{{ vitals.CPP }}</div>
                <div class="measure">mmHg</div>
                <div class="label" :class="{ changed: cppChange, alert: cppAlert }">CPP</div>
            </div>
            <div class="vital pbto2">
                <div class="tag">PbtO<sub>2</sub></div>
                <div class="rate" :class="{ changed: pbto2Change, alert: pbto2Alert }">{{ vitals.PbtO2 }}</div>
                <div class="measure">mmHg</div>
                <div class="label" :class="{ changed: pbto2Change, alert: pbto2Alert }">PbtO<sub>2</sub></div>
            </div>
            <div class="vital cvp">
                <div class="tag">CVP</div>
                <div class="rate" :class="{ changed: cvpChange, alert: cvpAlert }">{{ vitals.CVP }}</div>
                <div class="measure">mmHg</div>
                <div class="label" :class="{ changed: cvpChange, alert: cvpAlert }">CVP</div>
            </div>

            <div class="vital spo2">
                <div class="tag">SpO<sub>2</sub></div>
                <div class="rate" :class="{ changed: spo2Change, alert: spo2Alert }">{{ vitals.SpO2 }}</div>
                <div class="measure">pct</div>
                <div class="label" :class="{ changed: spo2Change, alert: spo2Alert }">SpO<sub>2</sub></div>
            </div>

            <div class="vital tperf">
                <div class="tag">Tperf</div>
                <div class="rate" :class="{ changed: tperfChange, alert: tperfAlert }">{{ vitals.Tperf }}</div>
                <div class="measure">C</div>
                <div class="label" :class="{ changed: tperfChange, alert: tperfAlert }">Tperf</sub></div>
            </div>

             <div class="vital perfdeltat">
                <div class="tag">perfDeltaT</div>
                <div class="rate" :class="{ changed: perfdeltatChange, alert: perfdeltatAlert }">{{ vitals.perfDeltaT }}</div>
                <div class="measure">C</div>
                <div class="label" :class="{ changed: perfdeltatChange, alert: perfdeltatAlert }">perfDeltaT</sub></div>
            </div>

             <div class="vital perf">
                <div class="tag">Perf</div>
                <div class="rate" :class="{ changed: perfChange, alert: perfAlert }">{{ vitals.Perfusion }}</div>
                <div class="measure">ml/100g/min</div>
                <div class="label" :class="{ changed: perfChange, alert: perfAlert }">Perf</sub></div>
            </div>
        </div>
       `,
      data() {
          return {
              hrChange: false,
              rrChange: false,
              systChange: false,
              diasChange: false,
              meanChange: false,
              etco2Change: false,
              icpChange: false,
              cppChange: false,
              pbto2Change: false,
              cvpChange: false,
              tperfChange: false,
              spo2Change: false,
              perfdeltatChange: false,
              burdenChange: false,
              perfChange: false,
              hrAlert: false,
              rrAlert: false,
              systAlert: false,
              diasAlert: false,
              meanAlert: false,
              etco2Alert: false,
              icpAlert: false,
              cppAlert: false,
              pbto2Alert: false,
              cvpAlert: false,
              tperfAlert: false,
              spo2Alert: false,
              perfdeltatAlert: false,
              perfAlert: false,
              burdenAlert: false,
          }
      },
      methods:{
        //Sets vital as red if it is out of range
          setAlert(updatedVital) {
              for(var ra=0; ra<this.ranges.length; ra++) {
                  if(this.ranges[ra].vitalName === updatedVital.vital) {
                      if(updatedVital.val > this.ranges[ra].vals.max || updatedVital.val < this.ranges[ra].vals.min) {
                          let alertStatus = {
                              patientId: this.patientId,
                              /* alerts ON */
                              status: true,
                              vitName: updatedVital.vital
                          }
                          /* alerts ON */
                          this[updatedVital.vital.toLowerCase()+'Alert'] = true;
                          /*setTimeout(function() {
                              this[updatedVital.vital.toLowerCase()+'Alert'] = false;
                          }.bind(this), 5000);*/
                          eventBus.$emit('set-alert', alertStatus);
                      }
                      else {
                          this[updatedVital.vital.toLowerCase()+'Alert'] = false;
                          let alertStatus = {
                              patientId: this.patientId,
                              status: false,
                              vitName: ''
                          }
                          eventBus.$emit('set-alert', alertStatus);
                      }
                  }
              }
          },

          //flickers metric once value has been updated
          setUpdate(vitalName) {
              /* stop flickering for now */
              this[vitalName+'Change'] = false;
              setTimeout(function() {
                  this[vitalName+'Change'] = false;
              }.bind(this), 500);
          }
      }
  })

// Socket.io set the path to the server
  var socket = io('ws://localhost:5000');

//creation of room objects that will be replaced once rooms array has been broadcasted from server
  const rooms = [{
      'roomId': 1,
      'roomNumber': '',
      'patient': {
          'patientId': '',
          'patientName': '',
          'alert': {
              'status': false,
              'vitName': ''
          },
          'vitals': {
              'HR': 0,
              'RR': 0,
              'ABPSyst': 0,
              'ABPDias': 0,
              'ABPMean': 0,
              'EtCO2': 0,
              'ICP': "-",
              'CPP': 0,
              'PbtO2': "-",
              'CVP': 0,
              'Tperf': 0,
              'SpO2': 0,
              'perfDeltaT': 0,
              'Perfusion': 0,
              'Burden': "-",
          },
          'changedVital': {
              'vital': '',
              'value': 0
         }
      }
  }];

//creation of ranges object holder until actual values are broadcasted from the server
//need this for the first time that the components are rendered before server communicates
  const ranges = [{
      'vitalName': '',
      'vals': {
          'min': 0,
          'max': 0
      }
  }];

  const customs =  {'c1': 0, 'c2': 0, 'c3': 0, 'c4': 0, 'c5': 0,
                    'c6': 0, 'c7': 0, 'c8': 0, 'c9': 0, 'c10': 0,
                    'c11': 0, 'c12': 0, 'c13': 0, 'c14': 0};

  //creation of vue instance
  var app = new Vue({
      el: '#station',
      data: {
          rooms: rooms,
          active: 999,
          ranges: ranges,
          facilityId: '',
          title: 'Demo Hospital',
          custom1: 0, custom2: 0, custom3: 0, custom4: 0, custom5: 0,
          custom6: 0, custom7: 0, custom8: 0, custom9: 0, custom10: 0,
          custom11: 0, custom12: 0, custom13: 0, custom14: 0,
          shift: 'First'
      },
      //carry out these methods once vue instance has been created for the first time
      created() {
          logData("Ready");
          // Socket.io 'connect' to Server
          // TIP: you can avoid listening on `connect` and listen to events directly!
          // see below where no action is taken until the Server sends.emits a 'init-data' message
          socket.on('connect', function() {
              logData("Connected to Server!");
          });

          // Socket.io receive 'init-data' from Server
          socket.on('init-data', function(rooms) {
              logData("init-data");
              this.rooms = rooms;
              socket.emit('send-records','Send info please');

          }.bind(this));

          //add faciility name to dashboard
          socket.on('update-title', function(facility) {
              logData("update-title");
              this.facilityId = facility.facilityId;
              this.title = facility.title;
          }.bind(this));

          //update shift
          socket.on('update-shift', function(shift) {
              logData("update-shift");
              this.shift = shift.name;
          }.bind(this));

          // update custom values
          socket.on('update-customs', function(customs) {
              this.custom1 = customs.c1;
              this.custom2 = customs.c2;
              this.custom3 = customs.c3;
              this.custom4 = customs.c4;
              this.custom5 = customs.c5;
              this.custom6 = customs.c6;
              this.custom7 = customs.c7;
              this.custom8 = customs.c8;
              this.custom9 = customs.c9;
              this.custom10 = customs.c10;
              this.custom11 = customs.c11;
              this.custom12 = customs.c12;
              this.custom13 = customs.c13;
              this.custom14 = customs.c14;
              newdata = [customs.c1, customs.c4, customs.c7, customs.c10]
              setData(0, newdata);
              newdata = [customs.c2, customs.c5, customs.c8, customs.c11]
              setData(1, newdata);
              newdata = [customs.c3, customs.c6, customs.c9, customs.c12]
              setData(2, newdata);
          }.bind(this));

          //add ranges based on which alerts will be generated
          socket.on('init-ranges', function(ranges) {
              logData("init-ranges");
              this.ranges = ranges;
          }.bind(this));

          //server will emit send-line message that will be handled here
          //search for specific metrics and create a new updateChanged object that will be broadcast to other vue components
          //sent through eventBus created at top of program
          socket.on('send-line',function(newLine) {
              //logData(newLine);
              var modalities = ['HR', 'ABPSyst', 'ABPDias', 'ABPMean', 'RR', 'EtCO2', 'ICP', 'CPP', 'PbtO2', 'CVP',
                  'Tperf', 'SpO2', 'perfDeltaT', 'Perfusion', 'Burden'];
              var vital = JSON.parse(newLine);
              for (var r=0; r<this.rooms.length; r++) {
                  if(this.rooms[r].patient.patientId === vital.PatientID) {
                      var updateChanged = { vital: '', val: "-" };
                      if(modalities.includes(vital.Modality)) {
                          this.rooms[r].patient.vitals[vital.Modality] = vital.Value;
                          updateChanged.vital = vital.Modality;
                          updateChanged.val = vital.Value;
                          this.rooms[r].patient.changedVital = updateChanged;
                      }
                  }
              }
          }.bind(this));
      },

      //allows for the passing of objects through the event bus
      mounted() {
          eventBus.$on('set-active', id => {
              this.active = id;
          }),
          eventBus.$on('reset-active', id => {
              this.active = 999;
          }),

          //allows vitals in alert status to change CSS class of grandparent component template
          eventBus.$on('set-alert', alertStatus => {
              for (var r=0; r<this.rooms.length; r++){
                  if(this.rooms[r].patient.patientId === alertStatus.patientId) {
                      this.rooms[r].patient.alert.status = alertStatus.status;
                      this.rooms[r].patient.alert.vitName = alertStatus.vitName;
                  }
              }
          })
      }
  });


  // demoCharts
var canvas = document.getElementById("barChart");
var ctx = canvas.getContext('2d');
var chartType = 'horizontalBar';
var myBarChart;

// Global Options:
Chart.defaults.global.defaultFontColor = 'rgb(230, 230, 230)';
Chart.defaults.global.defaultFontSize = 16;
Chart.defaults.scale.gridLines.display = false;

var data = {
  labels: ["MAP", "ICP", "PbtO2", "Burden"],
  datasets: [{
    // label: "Standard of Care Adherence",
    fill: true,
    lineTension: 0.1,
    borderColor: "black", // The main line color
    borderCapStyle: 'square',
    pointBorderColor: "white",
    pointBackgroundColor: "green",
    pointBorderWidth: 1,
    pointHoverRadius: 8,
    pointHoverBackgroundColor: "yellow",
    pointHoverBorderColor: "green",
    pointHoverBorderWidth: 2,
    pointRadius: 4,
    pointHitRadius: 10,

      data: [10,15,20,25],
        backgroundColor: '#435aa4',
      },
      {
          data: [85,80,75,70],
        backgroundColor: '#459c50',
      },
      {
          data: [5,5,5,5],
        backgroundColor: '#932b2b',
      }
    ]
  };

var options = {
  scales: {
  //     // xAxes: [{ stacked: true }, {ticks: {display: false, min: 0, max:100, stepValue: 10} }],
  //     // yAxes: [{ stacked: true }, {ticks: {display: false, min: 0, max:100, stepValue: 10} }]
  //     //xAxes: [{ stacked: true }],
      xAxes: [{ stacked: true }, {display: false}, {ticks: {display: false}}],
      // yAxes: [{ stacked: true }, {display: false}, {ticks: {display: false}}],
     //yAxes: [{display: false}, {ticks: {display: false}}],




  },
  title: {
    fontSize: 18,
    display: false,
    text: 'Title:Text',
    position: 'bottom'
  },
    tooltips: {enabled: false},
    hover: {mode: null},
    animation: {
      "duration": 1,
      "onComplete": function() {
        var chartInstance = this.chart,
          ctx = chartInstance.ctx;

        ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        this.data.datasets.forEach(function(dataset, i) {
          var meta = chartInstance.controller.getDatasetMeta(i);
          meta.data.forEach(function(bar, index) {
            var data = dataset.data[index];
            if (data > 0) {
                ctx.fillText(data + "%", bar._model.x - 20, bar._model.y + 7    );
            }
            // else if (data < 5) {
            //     ctx.fillText("<" + data + "%", bar._model.x + 17, bar._model.y + 7);
            // }
          });
        });
      }
    },

    legend: {display: false},
    layout: {
        padding: {
            left: 0,
            right: 30,
            top: 75,
            bottom: 110
        }
    },
};

init();

function init() {
    // Chart declaration:
    myBarChart = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
    });
}

function setData(i, indata) {
    myBarChart.data.datasets[i].data  = indata;
    myBarChart.update();
};
