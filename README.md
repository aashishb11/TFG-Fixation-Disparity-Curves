This TFG is split into two phases. The first phase focuses on building a web application to visualize Fixation Disparity Curves (FDC) and automatically classify the curve into one of four curve types using polynomial approximation and error comparison.

The app should also display the calculated errors for each curve type, based on the methodology described in the referenced paper.

Reference: Fixation disparity curve error calculation is based on the model described in the paper (see documentation):
https://pmc.ncbi.nlm.nih.gov/articles/PMC12682111/pdf/OPO-45-1642.pdf

Phase 1 — Web Application for Fixation Disparity Curves

Goal : 

Create an interactive web app that:

- plots fixation disparity data,

- approximates the data using four candidate polynomial curve models (Type 1–4),

- computes an error for each model,

- selects the curve type with the lowest error, and

- displays results clearly (graph + errors + classification).

Core Functional Requirements
1) Data Input

- The x-values are fixed (predefined clinical stimulus values).

- The y-values are patient responses (clinical measurement results).

- Each dataset consists of 7 (x, y) points:

- 7 fixed x inputs

- 7 corresponding y values entered/loaded for a patient

- The app must support providing these 7 y-values (e.g., form input, file input, or preset examples—implementation choice).

2) Curve Visualization (Graph)

- Display one graph containing four fitted curves, one per fixation disparity curve type:

- Type 1, Type 2, Type 3, Type 4

- Each curve must be drawn using a distinct color for easy comparison.

- The graph should also show the original 7 data points (patient responses) so that the user can visually compare the fit.

- Graph must include:

- axis labels (x = disparity stimulus, y = clinical response)

- legend mapping color → curve type

- consistent scaling (so fits are visually comparable)

3) Mathematical Approximation Model (Classification)

- For each of the 4 curve types, the app must:

- fit a polynomial-based model to the 7 data points

- compute a numeric error value for that fitted model

- The classification rule:

- Predicted curve type = the type with the minimum error

Important note:

Polynomial degree and fitting approach must follow the definitions / constraints in the documentation (paper).

4) Error Computation + Output

- The app must compute four error values, one for each curve type.

- The error calculation must follow the method described in the paper.

- Under the graph, the UI must display:

Error(Type 1)

Error(Type 2)

Error(Type 3)

Error(Type 4)

Also show:

- Final classification result (e.g., “Best fit: Type 2”)

(optional but useful) a small highlight/marker indicating which error is minimum

* UI / Design Requirements
1) Layout

Minimum expected layout:

Patient input section (7 y-values)

Graph section (4 curves + points)

Error results section (4 errors + predicted type)

2) Theme / Branding

The web app should follow a UPC-inspired design:

use UPC-like color palette, typography, and overall style

clean academic / institutional look

Exact theme details can be refined later (Phase 1 should still implement a consistent design baseline).

Phase 1 Deliverables

By the end of Phase 1, the repository should contain:

Fully working web app

Curve fitting + classification logic for Type 1–4

Error computation based on the referenced method

Graph showing:

7 measured points

4 fitted curves

Results display:

errors + predicted type

Documentation:

how to run locally

how inputs work

what the classification output means
