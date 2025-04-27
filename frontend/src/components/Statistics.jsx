import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Import TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the adapter

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale, // Register TimeScale
  Title,
  Tooltip,
  Legend
);

function Statistics({ apiUrl }) {
  const [stats, setStats] = useState({
    averageFulfillmentMinutesPastHour: 0,
    totalSalesPastHour: 0,
    deliveriesPerMinutePastHour: [], // Initialize chart data array
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null); // Ref to store interval ID

  const fetchStats = async () => {
    // Don't set loading to true on interval refresh, only initial load
    // setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/statistics`);
      setStats({
          averageFulfillmentMinutesPastHour: response.data.averageFulfillmentMinutesPastHour || 0,
          totalSalesPastHour: response.data.totalSalesPastHour || 0,
          deliveriesPerMinutePastHour: response.data.deliveriesPerMinutePastHour || []
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Failed to load statistics.");
      // Optionally clear stats on error or keep stale data
      // setStats({ averageFulfillmentMinutesPastHour: 0, totalSalesPastHour: 0, deliveriesPerMinutePastHour: [] });
    } finally {
      setLoading(false); // Set loading false after fetch completes
    }
  };

  useEffect(() => {
    setLoading(true); // Set loading true on initial mount
    fetchStats(); // Initial fetch

    // Set up interval to refresh stats every minute (60000 ms)
    intervalRef.current = setInterval(fetchStats, 60000);

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [apiUrl]); // Re-run effect if apiUrl changes

  // Prepare chart data
  const chartData = {
    // Use parsed dates for labels/x-axis
    labels: stats.deliveriesPerMinutePastHour.map(d => new Date(d.minute)),
    datasets: [
      {
        label: 'Orders Delivered',
        // Map counts to data points
        data: stats.deliveriesPerMinutePastHour.map(d => d.count),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Chart options using TimeScale
  const chartOptions = {
    scales: {
      x: {
        type: 'time', // Use time scale
        time: {
          unit: 'minute',
          tooltipFormat: 'PPpp', // Format for tooltip (e.g., Apr 27, 2025, 10:35 AM)
          displayFormats: {
            minute: 'HH:mm' // Format for axis labels (e.g., 10:35)
          }
        },
        title: {
          display: true,
          text: 'Time (Last Hour)'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Orders Delivered'
        },
        ticks: {
           stepSize: 1 // Ensure y-axis shows whole numbers for counts
        }
      }
    },
    plugins: {
       legend: {
          display: false // Hide legend if only one dataset
       },
       title: {
          display: true,
          text: 'Order Deliveries per Minute (Last Hour)'
       }
    }
  };


  if (loading) return <p>Loading statistics...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="statistics">
      <div className="stat-item">
        <strong>Avg. Fulfillment Time (Past Hour):</strong>
        <span>{stats.averageFulfillmentMinutesPastHour} min</span>
      </div>
      <div className="stat-item">
        <strong>Total Sales (Past Hour):</strong>
        <span>${stats.totalSalesPastHour.toFixed(2)}</span>
      </div>

      {/* Chart Section */}
      <div className="stat-chart" style={{ marginTop: '20px' }}>
        {stats.deliveriesPerMinutePastHour.length > 0 ? (
             <Line options={chartOptions} data={chartData} />
        ) : (
             <p>No delivery data available for the past hour.</p>
        )}
      </div>
    </div>
  );
}

export default Statistics;