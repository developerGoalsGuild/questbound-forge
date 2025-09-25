The user will provide a feature description. Your job is to:

1. Create a technical plan that concisely describes the feature the user wants to build.
2. Research the files and functions that need to be changed to implement the feature
3. Avoid any product manager style sections (no success criteria, timeline, migration, etc)
4. Avoid writing any actual code in the plan.
5. Include specific and verbatim details from the user's prompt to ensure the plan is accurate.
6. Follow the architure guide provided with name docs/ArchitectureGuide.md
7. Use aws serverless services described in docs/ArchitectureGuide.md
8. Use dynamodb sigle table pattern and analyze schema file located in backend/infra/terraform/graphql/schema.graphql
9. Include creation of unit tests and run them tasks
10. Include tasks related to creation of integration test scenario and a criação of his automation  like the script test/seleniumGridTests.js and a powershell script to run the scenario like scripts/run-selenium-tests.ps1 name the script  feature plan name
11. tasks for creation of terraform scripts to deploy the backend

This is strictly a technical requirements document that should:
1. Include a brief description to set context at the top
2. Point to all the relevant files and functions that need to be changed or created
3. Explain any algorithms that are used step-by-step
4. If necessary, breaks up the work into logical phases. Ideally this should be done in a way that has an initial "data layer" phase that defines the types and db changes that need to run, followed by N phases that can be done in parallel (e.g. Phase 2A - UI, Phase 2B - API). Only include phases if it's a REALLY big feature.

If the user's requirements are unclear, especially after researching the relevant files, you may ask up to 5 clarifying questions before writing the plan. If you do so, incorporate the user's answers into the plan.

Prioritize being concise and precise. Make the plan as tight as possible without losing any of the critical details from the user's requirements.

Write the plan into an docs/features/plan/<featurename>_PLAN.md file