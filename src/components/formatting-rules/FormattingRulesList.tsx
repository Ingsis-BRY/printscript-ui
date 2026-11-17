import {useGetFormatRules, useModifyFormatRules} from "../../utils/queries.tsx";
import {RulesList} from "../rules/RulesList.tsx";

const FormattingRulesList = () => (
  <RulesList title="Formatting rules" useRules={useGetFormatRules} useModify={useModifyFormatRules}/>
);

export default FormattingRulesList;
