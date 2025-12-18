# OpenSpec Proposal Command

Create a new feature proposal following the OpenSpec workflow.

## Instructions

When this command is invoked with a feature description:

1. Create a new folder in `openspec/changes/[feature-name]/`

2. Generate `proposal.md` with:
   - Feature name and description
   - Problem statement
   - Proposed solution
   - Success criteria
   - Out of scope items

3. Generate `tasks.md` with:
   - Numbered task list
   - Dependencies between tasks
   - Estimated complexity

4. Generate `specs/` folder with detailed specifications:
   - Requirements (SHALL/MUST language)
   - Data models
   - API contracts (if applicable)
   - UI specifications (if applicable)
   - Scenarios (Given/When/Then)

5. Present the proposal for review

## Usage
```
/openspec-proposal [feature description]
```
