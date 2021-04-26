<template>
  <div class="flex h-full">
    <div class="w-1/2 h-full">
      <div id="map" class="w-full h-full" />
    </div>
    <div class="w-1/2 h-full">
      <div class="bg-green-200">
        <div>
          <label>Title</label>
          <p>{{ Information.title }}</p>
        </div>
        <div>
          <label>Nome</label>
          <p>{{ Information.farmName }}</p>
        </div>
        <div class="flex">
          <div class="w-1/3">
            <label>NIRF</label>
            <p>{{ Information.nirf }}</p>
          </div>
          <div class="w-1/3">
            <label>Núm. INCRA</label>
            <p>{{ Information.incra }}</p>
          </div>
          <div class="w-1/3">
            <label>Área Total</label>
            <p>{{ Information.areaTotal }}</p>
          </div>
        </div>
      </div>
      <div class="bg-yellow-200 mt-2">
        <div class="flex" v-for="owner in Owners" :key="owner.taxId">
          <div class="w-1/3">
            <label>CPF/CNPJ</label>
            <p>{{ owner.taxId }}</p>
          </div>
          <div class="w-1/3">
            <label>Nome</label>
            <p>{{ owner.name }}</p>
          </div>
          <div class="w-1/3">
            <label>%</label>
            <p>{{ owner.share }}</p>
          </div>
        </div>
      </div>
      {{ index }}
      <span @click="add"> ADD </span>
      <span v-if="edit" @click="save"> SALVAR </span>
      <div class="bg-red-200">
        <div class="flex">
          <div class="w-1/4">
            <label>Matrícula</label>
          </div>
          <div class="w-full">
            <label>Nome</label>
          </div>
          <div class="w-1/5" @click="focusMap">
            <label>Todo</label>
          </div>
        </div>

        <div class="flex" v-for="(item, index) in IncraData" :key="index">
          <div class="w-1/4">
            <p>{{ Farm.incraData[item.matriculaId].registry }}</p>
          </div>
          <div class="w-full">
            <p>{{ Farm.incraData[item.matriculaId].farmName }}</p>
          </div>
          <div class="w-1/5 flex">
            <p v-if="!edit" class="mr-2" @click="focusMapIndex(index)">Focar</p>
            <button v-if="!edit" @click="editable(index)">ED</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DataJson from "@/assets/data";
import { randHexadecimalColor, invertLatLong } from "@/assets/farmLib";

export default defineComponent({
  name: "App",

  data: (): any => ({
    Farm: {},
    Map: {},
    index: -1,
    edit: false,
    fig: [],
  }),

  mounted() {
    if (!(window as any)?.google?.maps) {
      const googleMapsKey = "AIzaSyAkRnzcWdZfy9PQnI0d_Zp1CkKFkSin82U";
      const googleMaps = document.createElement("script");
      googleMaps.setAttribute(
        "src",
        `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap&libraries=drawing`
      );
      googleMaps.async = true;
      window.initMap = () => {
        const maps = (window as any).google?.maps;

        maps.Polygon.prototype.getBounds = function () {
          let bounds = new maps.LatLngBounds();
          let paths = this.getPaths();
          let path;
          for (let i = 0; i < paths.getLength(); i++) {
            path = paths.getAt(i);
            for (let ii = 0; ii < path.getLength(); ii++) {
              bounds.extend(path.getAt(ii));
            }
          }
          return bounds;
        };

        this.Map = new maps.Map(document.getElementById("map"), {
          zoom: 4,
          center: {
            lat: -12.726084,
            lng: -47.532103,
          },
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          disableDefaultUI: false,
          mapTypeId: "hybrid",
        });

        this.IncraData.forEach((trig, index): any => {
          // const color =
          // index === undefined
          //   ? randHexadecimalColor()
          //   : index === ind
          //   ? "#0f0"
          //   : "#999";

          const element: any = new maps.Polygon({
            paths: this.googleGeoData(trig.ll),
            strokeColor: randHexadecimalColor(),
            editable: false,
          });

          element.setMap(this.Map);
          element.addListener("rightclick", (ev) =>
            this.removePoint(ev, index)
          );
          this.fig[index] = element;
        });

        const polygonArray = this.geoData.map((item) => {
          return new maps.LatLng(item[0], item[1]);
        });

        const Polygon = new maps.Polygon({
          paths: polygonArray,
        });

        this.Map.fitBounds(Polygon.getBounds());
      };
      document.head.appendChild(googleMaps);
    }
  },

  created() {
    this.Farm = DataJson();
  },

  methods: {
    changeIndex(value: number) {
      this.index = value;
    },

    removePoint(ev, id) {
      if (this.fig[id].getEditable()) {
        const vertices = this.fig[id].getPath();
        if (vertices.length > 3) {
          for (let i = 0; i < vertices.getLength(); i++) {
            const xy = vertices.getAt(i);
            if (ev.latLng == xy) {
              this.fig[id].getPath().removeAt(i);
            }
          }
        }
      }
    },

    googleGeoData(data) {
      return data.reduce((arr, item) => {
        return [...arr, { lat: item[0], lng: item[1] }];
      }, []);
    },

    add() {
      const maps = (window as any).google?.maps;
      const drawing = new maps.drawing.DrawingManager({
        map: this.Map,
        drawingMode: maps.drawing.OverlayType.POLYGON,
        drawingControl: false,
        drawingControlOptions: {
          position: maps.ControlPosition.TOP_CENTER,
          drawingModes: ["polygon"],
        },

        polygonOptions: {
          strokeColor: "#0f0",
          // editable: true,
          // dragabble: true,
        },
      });

      drawing.addListener("polygoncomplete", (e) => {
        const polygon: any = [];
        e.getPaths().Nb[0].Nb.forEach((element) => {
          polygon.push([element.lng(), element.lat()]);
        });

        const Farm = this.Farm;

        this.Farm = {
          ...Farm,
          incraData: [
            ...Farm.incraData,
            {
              cityCode: "xxxxxxx",
              farmName: "XXX XXXX XXX",
              geometry: {
                coordinates: [polygon],
                type: "Polygon",
              },
              registry: "xx",
            },
          ],
        };

        const length = this.fig.length;
        this.fig[length] = e;
        e.addListener("rightclick", (ev) => this.removePoint(ev, length));

        drawing.setDrawingMode();
      });
    },

    focusMap() {
      const maps = (window as any).google?.maps;

      this.changeIndex(-1);

      const polygonArray = this.geoData.map((item) => {
        return new maps.LatLng(item[0], item[1]);
      });

      const Polygon = new maps.Polygon({
        paths: polygonArray,
      });

      this.fig.forEach((item, i) => {
        item.setOptions({
          strokeColor: randHexadecimalColor(),
          editable: false,
        });
      });

      this.Map.fitBounds(Polygon.getBounds());
    },

    focusMapIndex(index) {
      this.changeIndex(index);

      this.fig.forEach((item, i) => {
        if (index === i) {
          item.setOptions({
            strokeColor: "#0f0",
            editable: false,
          });
        } else {
          item.setOptions({
            strokeColor: "#999",
            editable: false,
          });
        }
      });

      this.Map.fitBounds(this.fig[index].getBounds());
    },

    save() {
      this.edit = false;
      this.focusMap();
    },

    editable(index) {
      this.edit = true;
      this.focusMapIndex(index);
      this.fig[index].getPaths().Nb[0].Nb.forEach((element) => {
        console.log(element.lat(), element.lng());
      });

      this.fig.forEach((item, i) => {
        if (index === i) {
          item.setOptions({ editable: true });
        } else {
          item.setOptions({ editable: false });
        }
      });
    },
  },

  computed: {
    Information(): any {
      return {
        title: this.Farm?.farmName,
        farmName: this.Farm?.farmData?.farmName || "",
        areaTotal:
          this.Farm.farmData?.totalArea || this.Farm.declaredTotalArea || "-",
        incra: this.Farm?.farmData?.numIncra || this.Farm.incraNumber || "-",
        nirf: this.Farm?.farmData?.nirf || this.Farm.nirfNumber || "-",
      };
    },
    Owners(): any {
      return this.Farm?.farmData?.owners?.reduce((items, item) => {
        let shareholders = [];
        if (item.shareholders) {
          shareholders = item.shareholders?.reduce((its, it) => {
            return [
              ...its,
              {
                taxId: it.ni,
                share: it.percentualParticipacao,
              },
            ];
          }, []);
        }
        return [
          ...items,
          {
            taxId: item.taxId,
            name: item.name,
            share: item.share,
          },
          ...shareholders,
        ];
      }, []);
    },
    IncraData(): any {
      const data = this.Farm.incraData.map((item, index) => {
        return {
          // ...item,
          matriculaId: index,
          ll: item?.geometry?.coordinates,
        };
      });

      return data.reduce((objectArray, item) => {
        if (!!item?.ll) {
          const arr = [];
          for (const iterator of item?.ll) {
            arr.push({
              matriculaId: item.matriculaId,
              ll: invertLatLong(iterator),
            });
          }
          return [...objectArray, ...arr];
        }

        return objectArray;
      }, []);
    },
    geoData(): any {
      return this.IncraData.reduce((arr, item) => {
        return [...arr, ...item?.ll];
      }, []);
    },
  },
});
</script>

<style lang="postcss" scoped></style>
