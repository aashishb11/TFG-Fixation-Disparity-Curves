# Presentation Preparation — Fixation Disparity Curves

**Reference paper:** Argilés et al. (2025) — *Mathematical models to describe fixation disparity curves*,
Ophthalmic and Physiological Optics. [PMC12682111](https://pmc.ncbi.nlm.nih.gov/articles/PMC12682111/)

---

## 1. What is Fixation Disparity?

When two eyes look at an object, ideally the visual axes of both eyes should point exactly at the same point. In practice, for most people there is a **small, involuntary misalignment** — the eyes are *almost* converged but not perfectly. This tiny residual error is called **fixation disparity**.

- It is measured in **arcminutes** (very small angles, 1 arcmin = 1/60 of a degree)
- Typical values are in the range of a few arcminutes
- It is **not the same as a squint (strabismus)** — the person still fuses the image and sees one thing, the misalignment is small enough that the visual system compensates for it
- It can be **eso** (eyes converging slightly too much) or **exo** (eyes diverging slightly too much)

---

## 2. What is a Fixation Disparity Curve (FDC)?

A **Fixation Disparity Curve** is a graph that shows how the fixation disparity of a patient **changes when you apply different vergence demands** using prism lenses.

- The **x-axis** represents the prism power applied (in prism diopters, from -15 to +15)
  - Negative values = base-in prisms → force the eyes to diverge
  - Positive values = base-out prisms → force the eyes to converge
- The **y-axis** is the fixation disparity measured in arcminutes at each prism level

The shape of this curve tells you a lot about how the visual system of the patient responds to vergence stress. It is a functional map of the **vergence system's adaptability**.

The measurements are taken at 7 standard prism positions: **-15, -10, -5, 0, 5, 10, 15** prism diopters.

---

## 3. The Four Curve Types (Ogle 1950 Classification)

The classification of FDC shapes was originally proposed by Ogle (1950) and is still used today:

| Type | Shape | Clinical meaning | Prevalence |
|------|-------|-----------------|------------|
| **Type I** | Symmetric S-shape (sigmoid) | Normal, balanced vergence response | ~60% of population |
| **Type II** | Asymmetric — flatter on the base-out side | Reduced ability to adapt to convergence demands | ~25% |
| **Type III** | Asymmetric — flatter on the base-in side | Reduced ability to adapt to divergence demands | ~10% |
| **Type IV** | Nearly flat | Minimal adaptive response in either direction | ~5% |

---

## 4. Why Does It Matter Clinically?

FDCs are used in **optometry and vision therapy** to:

1. **Diagnose binocular vision problems** — conditions like convergence insufficiency, which causes headaches, blurred vision and eye fatigue when reading
2. **Assess vergence system health** — the slope of the curve tells you how efficiently the visual system adapts to fusional stress
3. **Predict symptoms** — research has shown that steeper curve slopes appear more frequently in **symptomatic patients** (people who get headaches or visual fatigue)
4. **Guide treatment** — knowing the curve type helps decide whether prism correction or vision therapy is needed
5. **Monitor treatment progress** — the curve can be remeasured to see if the vergence system has improved

In summary: a patient with a steep, well-formed Type I curve has a healthy, adaptable vergence system. A patient with a flat Type IV curve or a very asymmetric curve may have problems tolerating visual tasks that require sustained vergence effort (reading, screens, driving).

---

## 5. The Existing Problem

### 5.1 Subjective Classification

Before the paper this application is based on, FDCs were classified by **visual inspection** — a clinician or researcher would look at the curve and decide "this looks like Type II." This introduces:

- **Inter-observer variability** — two clinicians may disagree on the same curve
- **Bias from clinical experience** — experienced optometrists sometimes weight symptoms over the mathematical shape of the curve
- In the paper's validation study, there was only **75% agreement** between experienced optometrists and the mathematical model on the same curves

### 5.2 No Type-Specific Mathematical Models

When researchers did try to use math, they applied **generic polynomial functions** (the same polynomial for all curve types, just with different degrees depending on the study). Problems with this:

- A polynomial of degree 3 or 4 can roughly fit any curve, but it does not encode any knowledge about the **biological meaning** of each curve type
- You cannot compute a meaningful **slope** from a generic polynomial and compare it across patients — the slope value depends on the polynomial degree chosen
- The paper tested this: using generic polynomials, the difference in slope between curve types was **not statistically significant (p = 0.36)**. Using the type-specific models, the difference was **highly significant (p = 0.002)**

### 5.3 Manual, Paper-Based Measurement Tools

The clinical measurement is done with tools like the **Wesson Fixation Disparity Card** — the clinician asks the patient questions at each of the 7 prism positions and writes down the values on paper. There was no automated or digital tool to:
- Take those 7 values, fit the curves and classify them instantly
- Show the clinician all four fitted models overlaid
- Export the result as a report

---

## 6. The Solution — What the Paper Proposes

The paper by Argilés et al. (2025) developed **four type-specific mathematical functions** — one for each FDC type — fitted using constrained least-squares optimization:

| Model | Equation | Why this shape |
|-------|----------|----------------|
| **T1** (cubic) | `f(x) = a + b·(x − c)³` | Cubic captures the symmetric S-shape of Type I |
| **T2** (positive exponential) | `f(x) = a + b·e^(−c·(x−d))` | Exponential decay captures the asymmetric drop on the base-out side |
| **T3** (negative exponential) | `f(x) = a − b·e^(c·(x−d))` | Mirror exponential captures the asymmetry on the base-in side |
| **T4** (arctangent) | `f(x) = a − b·arctan(c·(x−d))` | Arctangent naturally produces a flat, sigmoid-like curve that saturates early |

Each model has **clinically-derived constraints** on its parameters so the fitted curves stay in a physiologically plausible range (e.g. fixation disparity bounded between -10 and +10 arcmin at the extremes).

The **best-fitting model** is selected by minimizing the error (SSE / RMSE) — whichever of the four models fits the patient's 7 measured values best, that is the curve type.

**Key results from the paper:**
- **85% successful classification** across the validation dataset (17 out of 20 participants)
- Type-specific slopes showed statistically significant differences between curve types (p = 0.002), something not achievable with generic polynomials
- Mathematicians agreed 100% with the model classification; optometrists agreed 75%

---

## 7. The Application — How It Helps

I built this web application for my TFG to implement the paper's methodology and make it **accessible to clinicians without any programming or math knowledge**.

### What the clinician does:
1. Measures the patient's fixation disparity at the 7 prism positions using a Wesson card (takes ~5 minutes in clinic)
2. Opens the web application
3. Enters the 7 values
4. Clicks "Run Statistical Fit"

### What I made the application provide instantly:

| Feature | Clinical value |
|---|---|
| **Overlaid chart of all 4 fitted curves + measured points** | Clinician can visually inspect how well each model fits the real data |
| **SSE and RMSE for each model** | Objective numerical evidence for which model fits best |
| **Automatic best-fit classification (T1–T4)** | Removes subjective bias — the classification is mathematical, not visual |
| **Paper-defined slope per model** | The same slope metric used in research, not a rough linear fit — comparable across patients and studies |
| **Fixation disparity at x = 0** (zero prism demand) | The patient's natural fixation disparity without any prism — key baseline value |
| **Associated phoria** | The prism level at which the curve crosses zero — clinically relevant for prescribing |
| **PNG export** | High-resolution image of the chart for including in patient records |
| **PDF clinical report** | Full report with patient details and results for the clinical file |

### The broader impact I aimed for:

- **Reduces subjectivity** — the same patient measured by two different clinicians will get the same curve type from my application
- **Enables research reproducibility** — studies can use the same model and compare slopes across different populations
- **Makes advanced analysis accessible** — previously this required MATLAB and knowing how to set up a constrained optimization. With my tool it works in a browser
- **Faster clinical workflow** — results in seconds instead of manual analysis

---

## 8. Potential Presentation Flow

```
SLIDE 1 — The biological context
  What is binocular vision? What is vergence?
  → lead into: what happens when vergence is not perfect

SLIDE 2 — What is fixation disparity?
  Definition, normal values, eso vs exo
  → lead into: why we measure it

SLIDE 3 — Why measure it? (clinical relevance)
  Symptoms, diagnosis, treatment decisions
  → lead into: how we measure it

SLIDE 4 — Fixation Disparity Curves
  The 7-point measurement, the Wesson card
  Show an example curve (Type I)
  The 4 classical curve types with their clinical meaning

SLIDE 5 — The existing problem
  Subjective classification
  Generic polynomials and the slope problem
  No digital tool for the clinic

SLIDE 6 — The paper's solution
  Type-specific mathematical models (T1–T4)
  Constrained optimization
  Key results: 85% accuracy, p = 0.002 for slope differences

SLIDE 7 — The application (this TFG)
  Live demo or screenshots
  Walk through: enter values → see results → export PDF
  Highlight: same models as paper, now accessible in a browser

SLIDE 8 — Summary
  Before: subjective, inconsistent, paper-based
  After: objective, reproducible, instant, exportable
```

---

## 9. Key Numbers to Remember for the Presentation

| Fact | Value |
|---|---|
| Measurement positions | 7 prism diopters: -15, -10, -5, 0, +5, +10, +15 |
| Fixation disparity unit | Arcminutes |
| Type I prevalence | ~60% of population |
| Classification accuracy of the model | 85% (17/20 participants) |
| Optometrist agreement with model | 75% |
| Mathematician agreement with model | 100% |
| p-value for slope differences (type-specific models) | **0.002** (significant) |
| p-value for slope differences (generic polynomials) | 0.36 (not significant) |
| Request limit in this application | 30 per minute per IP |

---

## 10. Key Terms Glossary

| Term | Meaning |
|---|---|
| **Fixation disparity** | Small residual misalignment of the eyes during binocular fixation |
| **Vergence** | The inward/outward movement of the eyes to converge on a target |
| **Prism diopter** | Unit of prism power; higher value = more vergence demand |
| **Base-in prism** | Forces divergence (negative x in the curve) |
| **Base-out prism** | Forces convergence (positive x in the curve) |
| **SSE** | Sum of Squared Errors — total fitting error |
| **RMSE** | Root Mean Squared Error — average fitting error per point |
| **Slope** | Rate of change of fixation disparity with vergence demand; steeper = worse adaptation |
| **Associated phoria** | The prism level where fixation disparity = 0 |
| **Wesson card** | Clinical measurement tool used to record FDC data |
