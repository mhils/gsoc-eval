# GSoC Mentor Evaluation Tool

A simple application for initial GSoC proposal assessment.

- Projects grouped by subcategory
- Star Rating
- Mentor Comments
- Links to GSoC Site and Proposal PDF

![screenshot](https://maximilianhils.com/upload/2016-03/2016-03-28_04-09-27.png)

### Installation:

- `npm install`
- Copy contents of https://summerofcode.withgoogle.com/api/om/program/current/proposal/?page_size=1000 to proposals.json (requires authentication). (I'm unable to check if page_size > 100 actually works)

### Usage:

- `npm start`
- Hide app behind VPN/basic auth proxy
- Share access with mentors.

**:warning: There is no authentication, all operators are assumed to be trusted.**
