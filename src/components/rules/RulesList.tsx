import React, {useEffect, useState} from 'react';
import {
  Button,
  Card,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import {UseMutationResult, UseQueryResult} from "react-query";
import {Rule} from "../../types/Rule.ts";
import {defaultValueFor, RULES_SAVED_MESSAGE} from "../../utils/rules.ts";
import {queryClient} from "../../App.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";

type RulesListProps = {
  title: string;
  useRules: () => UseQueryResult<Rule[], Error>;
  useModify: (options: { onSuccess: () => void }) => UseMutationResult<Rule[], Error, Rule[]>;
}

export const RulesList = ({title, useRules, useModify}: RulesListProps) => {
  const [rules, setRules] = useState<Rule[] | undefined>([]);
  const {createSnackbar} = useSnackbarContext()

  const {data, isLoading, refetch} = useRules();
  const {mutateAsync, isLoading: isLoadingMutate} = useModify({
    onSuccess: () => {
      queryClient.invalidateQueries('listSnippets')
      refetch()
    }
  })

  useEffect(() => {
    setRules(data)
  }, [data]);

  const update = (rule: Rule, changes: Partial<Rule>) =>
    setRules(rules?.map(r => r.id === rule.id ? {...r, ...changes} : r))

  const handleNumberChange = (rule: Rule) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    update(rule, {value: isNaN(value) ? (rule.min ?? 0) : value});
  };

  const toggleRule = (rule: Rule) => () => {
    const isActive = !rule.isActive
    update(rule, isActive ? {isActive, value: defaultValueFor(rule)} : {isActive})
  }

  const handleSave = async () => {
    try {
      await mutateAsync(rules ?? [])
      createSnackbar('success', RULES_SAVED_MESSAGE)
    } catch (e) {
      createSnackbar('error', e instanceof Error ? e.message : 'Could not save the rules')
    }
  }

  return (
    <Card style={{padding: 16, margin: 16}}>
      <Typography variant={"h6"}>{title}</Typography>
      <List sx={{width: '100%', bgcolor: 'background.paper'}}>
        {
          isLoading || isLoadingMutate ? <Typography style={{height: 80}}>Loading...</Typography> :
            rules?.map((rule) => (
              <ListItem key={rule.id} disablePadding style={{minHeight: 48}} data-testid={`rule-${rule.id}`}>
                <Checkbox
                  edge="start"
                  checked={rule.isActive}
                  disableRipple
                  onChange={toggleRule(rule)}
                  inputProps={{'aria-label': `toggle ${rule.id}`}}
                />
                <ListItemText
                  primary={rule.name}
                  secondary={[rule.description, rule.since ? `since ${rule.since}` : undefined]
                    .filter(Boolean).join(" · ")}
                />
                {rule.type === 'integer' &&
                  <TextField
                    type="number"
                    variant={"standard"}
                    disabled={!rule.isActive}
                    value={rule.value ?? ''}
                    inputProps={{min: rule.min ?? undefined, max: rule.max ?? undefined}}
                    onChange={handleNumberChange(rule)}
                  />}
                {rule.type === 'enum' &&
                  <Select
                    variant={"standard"}
                    disabled={!rule.isActive}
                    value={String(rule.value ?? '')}
                    onChange={e => update(rule, {value: e.target.value})}
                    sx={{minWidth: 140}}
                  >
                    {rule.options?.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </Select>}
              </ListItem>
            ))}
      </List>
      <Button disabled={isLoading || isLoadingMutate} variant={"contained"} onClick={handleSave} data-testid="save-rules">Save</Button>
    </Card>
  );
};
