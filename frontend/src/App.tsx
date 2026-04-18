import { useMemo, useState, useRef, useCallback } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ReferenceLine, // <-- Added this import
} from "recharts";

type Point = { x: number; y: number };
type ModelKey = "T1" | "T2" | "T3" | "T4";

type ComputeResponse = {
  x: number[];
  measured: Point[];
  models: Record<
    ModelKey,
    {
      params: Record<string, number>;
      sse: number;
      rmse: number;
      slope: number;
      fitted_at_x: number[];
      curve: Point[];
    }
  >;
  classification: {
    best_by_sse: ModelKey;
    best_by_rmse: ModelKey;
  };
};

export default function App() {
  const fixedX = useMemo(() => [-15, -10, -5, 0, 5, 10, 15], []);
  const [yVals, setYVals] = useState<string[]>(Array(7).fill(""));
  const [resp, setResp] = useState<ComputeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);

  const onChange = (i: number, v: string) => {
    const next = [...yVals];
    next[i] = v;
    setYVals(next);
  };

  const compute = async () => {
    setError(null);
    const parsed = yVals.map((v) => Number(v));
    if (parsed.some((n) => Number.isNaN(n) || !Number.isFinite(n))) {
      setError("Please ensure all inputs contain valid numbers.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/v1/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ y: parsed }),
      });

      if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`);
      setResp((await r.json()) as ComputeResponse);
    } catch (e: any) {
      setError(e?.message ?? "Computation error.");
    } finally {
      setLoading(false);
    }
  };

  const mergedCurve = useMemo(() => {
    if (!resp) return [];
    const { T1, T2, T3, T4 } = resp.models;
    const n = Math.min(T1.curve.length, T2.curve.length, T3.curve.length, T4.curve.length);
    return Array.from({ length: n }, (_, i) => ({
      x: T1.curve[i].x,
      T1: T1.curve[i].y,
      T2: T2.curve[i].y,
      T3: T3.curve[i].y,
      T4: T4.curve[i].y,
    }));
  }, [resp]);

  const downloadImage = useCallback(() => {
    const svg = chartRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svg);
    const image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.clientWidth * 2;
      canvas.height = svg.clientHeight * 2;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.scale(2, 2);
        context.drawImage(image, 0, 0);
        const link = document.createElement("a");
        link.download = "Fixation_Disparity_Analysis.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      width: "100vw", 
      height: "100vh", 
      overflow: "hidden", 
      background: "#f8f9fa", 
      fontFamily: "'Inter', sans-serif" 
    }}>
      {/* Header */}
      <header style={{ 
        padding: "16px 32px", 
        background: "#fff", 
        borderBottom: "1px solid #dee2e6", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center" 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", color: "#212529" }}>Thesis: Fixation Disparity Curve Modeling</h1>
          <span style={{ fontSize: "12px", color: "#6c757d" }}>Mathematical optimization of T1–T4 non-linear fits</span>
        </div>
        {resp && (
          <button onClick={downloadImage} style={{
            padding: "8px 16px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 500
          }}>
            Export High-Res PNG
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar: Inputs */}
        <aside style={{ width: "350px", background: "#fff", borderRight: "1px solid #dee2e6", padding: "24px", overflowY: "auto" }}>
          <h2 style={{ fontSize: "16px", marginBottom: "20px", color: "#495057" }}>Input</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {fixedX.map((x, i) => (
              <div key={x} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#6c757d" }}>
                  x = {x}
                </label>
                <input
                  type="number"
                  value={yVals[i]}
                  onChange={(e) => onChange(i, e.target.value)}
                  placeholder="Patient's input"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ced4da", outline: "none" }}
                />
              </div>
            ))}
          </div>

          <button onClick={compute} disabled={loading} style={{
            width: "100%", marginTop: "24px", padding: "12px", background: loading ? "#adb5bd" : "#212529", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600
          }}>
            {loading ? "Optimizing..." : "Run Statistical Fit"}
          </button>
          {error && <div style={{ marginTop: "12px", color: "#dc3545", fontSize: "13px" }}>{error}</div>}
        </aside>

        {/* Right Dashboard: Results and Plot */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", gap: "24px", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            
            {/* Performance Metrics Table */}
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #dee2e6", color: "#212529" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#6c757d" }}>Fit Accuracy Metrics</h3>

              {!resp ? (
                <div style={{ color: "#adb5bd", fontSize: "13px", padding: "10px 0" }}>Awaiting computation...</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "#212529" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                      <th style={{ padding: "8px", color: "#495057", fontWeight: 700 }}>Model</th>
                      <th style={{ padding: "8px", color: "#495057", fontWeight: 700 }}>SSE</th>
                      <th style={{ padding: "8px", color: "#495057", fontWeight: 700 }}>RMSE</th>
                      <th style={{ padding: "8px", color: "#495057", fontWeight: 700 }}>Slope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(["T1", "T2", "T3", "T4"] as const).map((k) => (
                      <tr key={k} style={{ background: resp.classification.best_by_sse === k ? "#f8f9fa" : "transparent" }}>
                        <td style={{ padding: "10px", fontWeight: 700, color: "#212529" }}>{k.replace("T", "Type ")}</td>
                        <td style={{ padding: "10px", color: "#212529" }}>{resp.models[k].sse.toFixed(3)}</td>
                        <td style={{ padding: "10px", color: "#212529" }}>{resp.models[k].rmse.toFixed(3)}</td>
                        <td style={{ padding: "10px", color: "#212529" }}>{resp.models[k].slope.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Diagnostic Classification */}
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #dee2e6", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#6c757d" }}>Classification</h3>
              {resp ? (
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0d6efd" }}>
                  {resp.classification.best_by_sse.replace("T", "Type ")}
                  <span style={{ display: "block", fontSize: "12px", fontWeight: 400, color: "#6c757d", marginTop: "4px" }}>
                    Selected as the primary clinical model based on Sum of Squared Errors (SSE)
                  </span>
                </div>
              ) : <div style={{ color: "#adb5bd", fontSize: "13px" }}>Run analysis to classify...</div>}
            </div>
          </div>

          {/* Large Graph Area */}
          <div style={{ flex: 1, background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #dee2e6", minHeight: "500px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#6c757d" }}>Regression Visualization</h3>
            <div ref={chartRef} style={{ width: "100%", height: "90%" }}>
              <ResponsiveContainer>
                <ComposedChart data={mergedCurve} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                  
                  {/* UPDATED X-AXIS */}
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={[-20, 20]} 
                    ticks={[-20, -15, -10, -5, 0, 5, 10, 15, 20]}
                    label={{ value: "Input", position: "bottom", offset: 20 }}
                  />
                  
                  {/* UPDATED Y-AXIS */}
                  <YAxis 
                    type="number"
                    domain={[-20, 20]}
                    ticks={[-20, -15, -10, -5, 0, 5, 10, 15, 20]}
                    label={{ value: "Patient's input", angle: -90, position: "insideLeft", offset: 0 }}
                    stroke="#adb5bd"
                  />

                  {/* CROSSHAIR REFERENCE LINES (x=0, y=0) */}
                  <ReferenceLine x={0} stroke="#adb5bd" strokeWidth={1.5} />
                  <ReferenceLine y={0} stroke="#adb5bd" strokeWidth={1.5} />
                  
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  
                  <Line name="Type I" type="monotone" dataKey="T1" dot={false} stroke="#e63946" strokeWidth={3} isAnimationActive={false} />
                  <Line name="Type II" type="monotone" dataKey="T2" dot={false} stroke="#457b9d" strokeWidth={3} isAnimationActive={false} />
                  <Line name="Type III" type="monotone" dataKey="T3" dot={false} stroke="#2a9d8f" strokeWidth={3} isAnimationActive={false} />
                  <Line name="Type IV" type="monotone" dataKey="T4" dot={false} stroke="#a8dadc" strokeWidth={3} isAnimationActive={false} />
                  
                  <Scatter name="Measured Data" data={resp?.measured} fill="#212529" dataKey="y" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}