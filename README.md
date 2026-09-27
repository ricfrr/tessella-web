# tessel·la Website

[Visit the website](https://ricfrr.github.io/tessella-web/)

## Description
The site for tessel·la, an independent project for open, friendly robotics tools, and the home of Robo·Boy.
It follows the design language of the Robo·Boy teaser: a cream ground, cobalt letters and a tangerine dot,
night-black "footage" scenes, kinetic lowercase headlines, and a HUD with a section label and a scroll rail.

The dedicated [Robo-Boy documentation experience](docs.html) covers setup, ROS 2 connectivity, application
architecture, built-in panels, and the complete external Panel SDK authoring and distribution workflow.

## Structure
- `index.html`, `site.css`, `site.js`: the home page (static HTML, no build step).
- `docs.html`, `docs.css`, `docs.js`: the Robo·Boy documentation.
- `tokens.css`: the shared design tokens (palette, type roles, brand mark, buttons, chips) used by both pages.
- `fonts/`: self-hosted Bricolage Grotesque, Courier Prime and Doto (SIL OFL 1.1, licences included).
- `media/videos/robo-boy/`: the teaser (H.264, 1080p30) and its poster.

Both pages share the theme choice (`tessella-theme` in localStorage) and follow the system theme until one is picked.

## Technologies
- HTML
- CSS
- JavaScript
