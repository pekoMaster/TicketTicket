# OpenSpec Apply Command

Implement approved specifications from a change proposal.

## Instructions

When this command is invoked:

1. Read the change proposal from `openspec/changes/[feature-name]/`

2. Verify all specs are approved and ready for implementation

3. Follow the task list in `tasks.md` sequentially

4. For each task:
   - Read the relevant specs
   - Implement according to specifications
   - Mark task as complete in tasks.md
   - Verify implementation matches specs

5. After all tasks complete:
   - Run tests if applicable
   - Update specs if any clarifications were needed
   - Report completion status

## Usage
```
/openspec-apply [feature-name]
```
