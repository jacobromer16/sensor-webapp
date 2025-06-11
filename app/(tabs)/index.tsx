import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // imported to create tabs 
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'; // Chart rendering components 
import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'; // React Native UI Components

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


// Constants
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;   // Retrieves device dimensions for chart sizing
const chartHeight = screenHeight / 3.5;
const NUM_COLUMNS = 35; // 35 data channels 7 per satellite 5 satellites each channel has 170 samples
const DATA_LENGTH = 170;

// Sampling Frequencies (Hz)
const SamplingFreqGyro = 2730.66;
const SamplingFreqImpact = 5461.33;
const SamplingFreqAccelero = 5120;

// Chart Dimensions
const GyroDimensions = 2000 ;
const AcceleroDimensions = 4000 ;
const ImpactDimensions = 2.4 ;

const staticColors = [
  '#28a745', '#007bff', '#ffc107', '#dc3545',
  '#17a2b8', '#6f42c1', '#fd7e14',
];

// array column identifiers
const labelMap: { [key: string]: string } = {
  col0:  'Gyro X', col1:  'Gyro Y', col2:  'Gyro Z', col3:  'Accel X', col4:  'Accel Y', col5:  'Accel Z', col6:  'Impact',
  col7:  'Gyro X', col8:  'Gyro Y', col9:  'Gyro Z', col10: 'Accel X', col11: 'Accel Y', col12: 'Accel Z', col13: 'Impact',
  col14: 'Gyro X', col15: 'Gyro Y', col16: 'Gyro Z', col17: 'Accel X', col18: 'Accel Y', col19: 'Accel Z', col20: 'Impact',
  col21: 'Gyro X', col22: 'Gyro Y', col23: 'Gyro Z', col24: 'Accel X', col25: 'Accel Y', col26: 'Accel Z', col27: 'Impact',
  col28: 'Gyro X', col29: 'Gyro Y', col30: 'Gyro Z', col31: 'Accel X', col32: 'Accel Y', col33: 'Accel Z', col34: 'Impact',
};

const ChartBlock = ({  // React Component to create and display a single chart block component
  title, series, yAxisMin, yAxisMax, yAxisTitle, compact = false,
}: {
  title: string;
  series: { label: string; data: number[] }[];
  yAxisMin: number;
  yAxisMax: number;
  yAxisTitle: string;
  compact?: boolean;
}) => {
  const sampleFreq =   // creates the charts X axis values (ms) based on the chart title and associated sampling freq
    title === 'Gyroscope' ? SamplingFreqGyro :
    title === 'Accelerometer' ? SamplingFreqAccelero :  
    SamplingFreqImpact;

  const timeLabels = series[0]?.data.map((_, idx) =>
    `${(idx * (1000 / sampleFreq)).toFixed(1)}`
  );

  const chartData = { // Maps input series to Chart.js datasets.
    labels: timeLabels,
    datasets: series.map((s, i) => ({
      label: labelMap[s.label] || s.label, // using label map converts keys (col0, col1 etc) into associated labels)
      data: s.data,
      borderColor: staticColors[i % staticColors.length],
      backgroundColor: staticColors[i % staticColors.length],
      fill: false,
      pointRadius: 0,
      tension: 0.4,
    })),
  };

  const options = { // configures both axis, x in (ms) y axis as a prop, also configures grid lines and legend
    responsive: false,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: !compact,
          text: 'Time (ms)',
       //   color: '#fff',
          font: { size: 14, weight: 'bold' },
        },
        ticks: {
          display: true,
          font: { size: compact ? 8 : 12, weight: 'bold' },
          maxTicksLimit: 10,
        },
        grid: {
          display: true,
          color: '#e0e0e0',
          lineWidth: 1,
        },
      },
      y: {
        title: {
          display: !compact,
          text: yAxisTitle,
          font: { size: 14, weight: 'bold' },
        },
        ticks: {
          font: { size: compact ? 8 : 12, weight: 'bold' },
        },
        min: yAxisMin,
        max: yAxisMax,
        grid: {
          color: (ctx: any) => (ctx.tick.value === 0 ? '#000' : '#ccc'),
          lineWidth: (ctx: any) => (ctx.tick.value === 0 ? 2 : 1),
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          boxWidth: 10,
          boxHeight: 6,
          usePointStyle: true,
          pointStyle: 'rect',
          font: { weight: 'bold', size: compact ? 10 : 12 },
          color: '#333',
        },
      },
    },
  };

  return (
    <View style={[styles.chartBlock, compact && styles.compactChart]}>
      <Text style={[styles.subtitle, compact && styles.compactSubtitle]}>{title}</Text>
      <Line
        data={chartData}
        options={options}
        width={compact ? screenWidth / 3.6 : screenWidth / 2 - 30} // width and height calculations just work im not sure - 
        height={compact ? chartHeight / 2.2 : chartHeight}         // why the numbers work as they are 
      />
    </View>
  );
};

const SensorTab = ({ startIndex, sensorData }: { startIndex: number; sensorData: { [key: string]: number[] } }) => {
  const getSeries = (keys: string[]) =>
    keys.map((key) => ({
      label: key,
      data: sensorData[key] || [],
    }));

  const keys = Array.from({ length: 7 }, (_, i) => `col${startIndex + i}`);


  ///////////// How "series" works  //////////////////////////////////////////////////////
  // Let’s say you are rendering an Accelerometer chart for Satellite 1.
  //                    const keys = Array.from({ length: 7 }, (_, i) => `col${startIndex + i}`);
  // we would get this ['col0', 'col1', 'col2', 'col3', 'col4', 'col5', 'col6']
  // then for the accelerometer series={getSeries(keys.slice(3, 6))}  // ['col3', 'col4', 'col5']
  // this becomes       series = [
  //                      { label: 'col3', data: sensorData['col3'] },
  //                      { label: 'col4', data: sensorData['col4'] },
  //                      { label: 'col5', data: sensorData['col5'] },
  //                    ];
  // Each entry in series then becomes a separate line on the chart.                    
  //                      datasets: series.map((s, i) => ({
  //                      label: labelMap[s.label] || s.label,  // Converts col3 -> "Accel X"
  //                      data: s.data,                         // 170 samples
  //                      ...
  //                    }))
  // How it configures for all 5 charts //
  // Each SensorTab is passed a startIndex, which is:
  //                    <SensorTab startIndex={14} sensorData={sensorData} />  // Satellite 3
  //                    startIndex = 7 * satelliteIndex
  // This offset tells the tab which set of 7 columns (out of 35) to use for that satellite.
  //
  //
  /////////////////////////////////////////////////////////////////////////////////////
  return (
    <View style={styles.fixedContainer}>
      <Text style={styles.title}>Sensor Dashboard</Text>
      <View style={styles.topRow}>
        <ChartBlock
          title="Accelerometer"
          series={getSeries(keys.slice(3, 6))}
          yAxisMin={-AcceleroDimensions}
          yAxisMax={AcceleroDimensions}
          yAxisTitle="Acceleration (g)"
        />
        <ChartBlock
          title="Gyroscope"
          series={getSeries(keys.slice(0, 3))}
          yAxisMin={-GyroDimensions}
          yAxisMax={GyroDimensions}
          yAxisTitle="Angular Velocity (°/s)"
        />
      </View>
      <View style={styles.bottomRow}>
        <ChartBlock
          title="Impact"
          series={getSeries([keys[6]])}
          yAxisMin={0}
          yAxisMax={ImpactDimensions}
          yAxisTitle="Impact (V)"
        />
      </View>
    </View>
  );
};

const AllSatellitesTab = ({ sensorData }: { sensorData: { [key: string]: number[] } }) => {
  const chartTypes = ['Accelerometer', 'Gyroscope', 'Impact'];
  const chartSettings = {
    Accelerometer: { yMin: -AcceleroDimensions, yMax: AcceleroDimensions, yLabel: 'Acceleration (g)' },
    Gyroscope: { yMin: -GyroDimensions, yMax: GyroDimensions, yLabel: 'Angular Velocity (°/s)' },
    Impact: { yMin: 0, yMax: ImpactDimensions, yLabel: 'Impact (V)' },
  };

  const chartBlocks: JSX.Element[] = [];

  for (let i = 0; i < 5; i++) {
    const startIndex = i * 7;
    const keys = Array.from({ length: 7 }, (_, j) => `col${startIndex + j}`);
    const getSeries = (indices: number[]) =>
      indices.map((j) => ({
        label: keys[j],
        data: sensorData[keys[j]] || [],
      }));

    chartTypes.forEach((type) => {
      const { yMin, yMax, yLabel } = chartSettings[type as keyof typeof chartSettings];
      const indices = type === 'Impact' ? [6] : type === 'Gyroscope' ? [0, 1, 2] : [3, 4, 5];
      chartBlocks.push(
        <ChartBlock
          key={`${type}-${i}`}
          title={type}
          series={getSeries(indices)}
          yAxisMin={yMin}
          yAxisMax={yMax}
          yAxisTitle={yLabel}
          compact={true}
        />
      );
    });
  }

  return <View style={styles.allSatellitesGrid}>{chartBlocks}</View>;
};

const Tab = createBottomTabNavigator();

export default function App() {
  const [sensorData, setSensorData] = useState<{ [key: string]: number[] }>(() => {     // initialies the array 35 columns 170 rows 
    const data: { [key: string]: number[] } = {};
    for (let i = 0; i < NUM_COLUMNS; i++) {
      data[`col${i}`] = Array(DATA_LENGTH).fill(0);                                     // initiallizes all values to 0
    }
    return data;
  });

  const handleLiveSensorUpdate = (newValues: { [key: string]: number[] }) => {
    setSensorData(newValues);
  };

  return (
    <>
      <Tab.Navigator sceneContainerStyle={{ backgroundColor: '#fff' }}>
        <Tab.Screen name="Satellite Board 1">
          {() => <SensorTab startIndex={0} sensorData={sensorData} />}
        </Tab.Screen>
        <Tab.Screen name="Satellite Board 2">
          {() => <SensorTab startIndex={7} sensorData={sensorData} />}
        </Tab.Screen>
        <Tab.Screen name="Satellite Board 3">
          {() => <SensorTab startIndex={14} sensorData={sensorData} />}
        </Tab.Screen>
        <Tab.Screen name="Satellite Board 4">
          {() => <SensorTab startIndex={21} sensorData={sensorData} />}
        </Tab.Screen>
        <Tab.Screen name="Satellite Board 5">
          {() => <SensorTab startIndex={28} sensorData={sensorData} />}
        </Tab.Screen>
        <Tab.Screen name="All Satellites">
          {() => <AllSatellitesTab sensorData={sensorData} />}
        </Tab.Screen>
      </Tab.Navigator>

      <BLEConnector onSensorData={handleLiveSensorUpdate} />
    </>
  );
}

const styles = StyleSheet.create({
  fixedContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  chartBlock: {
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  compactChart: {
    width: screenWidth / 3.6,
    height: chartHeight / 2.2,
    margin: 2,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: 'bold',
  },
  compactSubtitle: {
    fontSize: 10,
    marginBottom: 1,
  },
  allSatellitesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  bleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  bleText: {
    fontSize: 12,
    color: '#333',
  },
  bleButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  bleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});


//////////////////////////////////////////////////////
//                    BLE CONNECTOR
//////////////////////////////////////////////////////


const BLEConnector = ({ onSensorData }: { onSensorData: (data: { [key: string]: number[] }) => void }) => {
  
  const [status, setStatus] = useState('Disconnected');
  const [connected, setConnected] = useState(false);
  const sensorMatrixRef = useRef<number[][]>(
    Array.from({ length: 170 }, () => Array(35).fill(null))
  );
  

  const incompleteChunksRef = useRef<{ [uuid: string]: number[] }>({});

  const deviceName = 'Dummy Data';
  const userServiceUUID = '152f2e2d-2c2b-2a29-2827-262524232221';
  const gyroscopeUUID = '100f0e0d-0c0b-0a09-0807-060504030201';
  const accelerometerUUID = '201f1e1d-1c1b-1a19-1817-161514131211';
  const impactsensorUUID = '302f2e2d-2c2b-2a29-2827-262524232221';

  let accCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];
  let gyroCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];
  let impactCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];
  let userDataCharacteristics: BluetoothRemoteGATTCharacteristic[] = [];

  const sensorStartTimesRef = useRef<number[]>(Array(15).fill(null)); // start time array 15 vales 3 sensors x5 satellites


  const connectToDevice = async () => {
    try {
      setStatus('Requesting BLE device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: deviceName }],
        optionalServices: [userServiceUUID, accelerometerUUID, gyroscopeUUID, impactsensorUUID],
      });

      const server = await device.gatt!.connect();
      setStatus(`Connected to ${device.name}`);
      setConnected(true);

      const impactService = await server.getPrimaryService(impactsensorUUID);
      impactCharacteristics = await impactService.getCharacteristics();

      const accService = await server.getPrimaryService(accelerometerUUID);
      accCharacteristics = await accService.getCharacteristics();

      const gyroService = await server.getPrimaryService(gyroscopeUUID);
      gyroCharacteristics = await gyroService.getCharacteristics();

      const userService = await server.getPrimaryService(userServiceUUID);
      userDataCharacteristics = await userService.getCharacteristics();

      subscribeToAllNotifications();
    } catch (err) {
      console.error('BLE connection failed:', err);
      setStatus('BLE connection failed.');
    }
  };

  const subscribeToAllNotifications = () => {
    const allCharacteristics = [
      ...accCharacteristics,
      ...gyroCharacteristics,
      ...impactCharacteristics,
      ...userDataCharacteristics,
    ];

    allCharacteristics.forEach((char) => {
      char.startNotifications().then(() => {
        char.addEventListener('characteristicvaluechanged', (event) =>
          handleCharacteristicNotification(event.target as BluetoothRemoteGATTCharacteristic)
        );
        console.log(`Notifications started for ${char.uuid}`);
      }).catch((e) => console.log('Notification error:', e));
    });
  };

  const handleCharacteristicNotification = (characteristic: BluetoothRemoteGATTCharacteristic) => {
    const uuid = characteristic.uuid;
    const value = characteristic.value!;
    const chunk = new Uint8Array(value.buffer);

    if (!incompleteChunksRef.current[uuid]) {
      incompleteChunksRef.current[uuid] = [];
    }
    incompleteChunksRef.current[uuid].push(...chunk);

    const len = incompleteChunksRef.current[uuid].length;

    const finalizeAndStore = (bufferSize: number, axisOffset: number, startIdx: number) => {
      const completeBuffer = new Uint8Array(incompleteChunksRef.current[uuid].slice(0, bufferSize));
      incompleteChunksRef.current[uuid] = [];

      const view = new DataView(completeBuffer.buffer);
      const eventId = view.getUint16(0, true);
      const satelliteId = view.getUint8(2);
      const axisType = view.getUint8(3);
      const startTime = view.getUint32(4);
      const samples: number[] = [];
      const impactTimes: number[] = [];
      const gyroTimes: number[] = [];
      const acceleroTimes: number[] = [];
      



      const satOffset = (satelliteId - 1) * 7;
      let columnIndex: number | null = null;
      let multipler =0;
      if (gyroCharacteristics.some((c) => c.uuid === uuid)) {
        console.log('Gyro');
        columnIndex = satOffset + axisType;
        gyroTimes.push(view.getUint32(4, false));
        // samples.map(x => x / 16.4)
        for (let i = startIdx; i < view.byteLength; i += 2) {
          samples.push(view.getInt16(i, false));
        }
        
        //  for (let i = 4; i < 16; i += 4) {
        //    gyroTimes.push(view.getUint32(i, false));
        //  }

        console.log(gyroTimes);
        multipler = 1/16.4;
      } else if (accCharacteristics.some((c) => c.uuid === uuid)) {
        console.log('Acc');
        columnIndex = satOffset + 3 + axisType;
        multipler = 0.2;
        for (let i = startIdx; i < view.byteLength; i += 2) {
          samples.push(view.getInt16(i, true));
        }

      } else if (impactCharacteristics.some((c) => c.uuid === uuid)) {
        console.log('Impact');
        columnIndex = satOffset + 6;
        // samples.map(x => x *(2.42/4095))
        multipler = (2.42/4095);
        for (let i = startIdx; i < view.byteLength; i += 2) {
          samples.push(view.getInt16(i, false));
        }
      }

      if (columnIndex !== null) {
        for (let i = 0; i < samples.length && i < 170; i++) {
          console.log(samples);
          sensorMatrixRef.current[i][columnIndex] = samples[i]*multipler;
        }

        console.log(`Stored data → Satellite ${satelliteId}, Col ${columnIndex}, Samples: ${samples.length}`);

        // Push update to parent chart
        const newData: { [key: string]: number[] } = {};
        for (let col = 0; col < 35; col++) {
          newData[`col${col}`] = sensorMatrixRef.current.map((row) => row[col] ?? 0);
        }
        onSensorData(newData);
      }
    };

    if (len >= 354) {
      finalizeAndStore(354, 0, 14);
    } else if (len === 353) {
      finalizeAndStore(353, 0, 13);
    }
  };

//const downloadCSV = (sensorMatrix: number[][]) => {
//  if (!Array.isArray(sensorMatrix) || !Array.isArray(sensorMatrix[0])) {
//    alert('No data to export!');
//    return;
//  }
//  const rows = sensorMatrix.map(row =>
//    row.map(val => (val !== null ? val.toFixed(4) : '0')).join(',')
//  );
//  const csvContent = rows.join('\n');
//  const now = new Date();
//  const fileName = `SensorData_${now.toISOString().slice(0,19).replace(/:/g,"-")}.csv`;
//
//  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//  const url = URL.createObjectURL(blob);
//
//  const a = document.createElement('a');
//  a.href = url;
//  a.download = fileName;
//  document.body.appendChild(a);
//  a.click();
//  document.body.removeChild(a);
//  URL.revokeObjectURL(url);
//};

const downloadCSV = async (sensorMatrix: number[][]) => {
  if (!Array.isArray(sensorMatrix) || !Array.isArray(sensorMatrix[0])) {
    alert('No data to export!');
    return;
  }
  const rows = sensorMatrix.map(row =>
    row.map(val => (val !== null ? val.toFixed(4) : '0')).join(',')
  );
  const csvContent = rows.join('\n');
  const now = new Date();
  const defaultName = `SensorData_${now.toISOString().slice(0,19).replace(/:/g,"-")}.csv`;

  // Check if File System Access API is available
  if ('showSaveFilePicker' in window) {
    try {
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'CSV Files',
            accept: { 'text/csv': ['.csv'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(csvContent);
      await writable.close();
      alert('File saved successfully!');
    } catch (e) {
      // if (e.name !== 'AbortError') alert('Could not save file: ' + e.message); // add back if you want the catch 
    }
  } else {
    // Fallback for unsupported browsers: trigger download as before
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

const loadCSVAndPlot = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split('\n');
    const matrix: number[][] = lines.map(line =>
      line.split(',').map(x => parseFloat(x))
    );

    const newData: { [key: string]: number[] } = {};
    for (let col = 0; col < 35; col++) {
      newData[`col${col}`] = matrix.map(row => row[col] ?? 0);
    }

    onSensorData(newData);
  };

  input.click();

};

  return (
    <View style={[styles.bleBar, { flexDirection: 'column', alignItems: 'center' }]}>
  <Text style={styles.bleText}>{status}</Text>
  <View style={{ flexDirection: 'row', gap: 10, marginVertical: 4 }}>
    <TouchableOpacity
      onPress={connectToDevice}
      disabled={connected}
      style={[styles.bleButton, connected && { backgroundColor: 'gray' }]}
    >
      <Text style={styles.bleButtonText}>{connected ? 'Connected' : 'Connect'}</Text>
    </TouchableOpacity>
          <TouchableOpacity
        onPress={() => downloadCSV(sensorMatrixRef.current)}
        style={styles.bleButton}
      >
        <Text style={styles.bleButtonText}>Export CSV</Text>
      </TouchableOpacity>
    <TouchableOpacity
      onPress={loadCSVAndPlot}
      style={styles.bleButton}
    >
      <Text style={styles.bleButtonText}>Plot Saved</Text>
    </TouchableOpacity>
  </View>
</View>
  );
  
};

