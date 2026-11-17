import {useGetLintingRules, useModifyLintingRules} from "../../utils/queries.tsx";
import {RulesList} from "../rules/RulesList.tsx";

const LintingRulesList = () => (
  <RulesList title="Linting rules" useRules={useGetLintingRules} useModify={useModifyLintingRules}/>
);

export default LintingRulesList;
