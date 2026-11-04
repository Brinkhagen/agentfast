const ANSI = { reset:'\x1b[0m', cyan:'\x1b[36m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', dim:'\x1b[2m', bold:'\x1b[1m' };
const color = (value,style,enable) => enable ? ANSI[style]+value+ANSI.reset : value;

export function formatReport(plan,options={}) {
  const c=options.color ?? (process.stdout.isTTY && !process.env.NO_COLOR);
  const mode=plan.decision.mode;
  const modeText=mode==='full' ? 'FULL TEST SUITE' : mode==='targeted' ? 'TARGETED TESTS' : 'NO TESTS SUGGESTED';
  const tone=mode==='full'?'yellow':'green';
  const lines=[
    color('  AGENTFAST','bold',c)+color('  /  VERIFY SMARTER','cyan',c),
    '  '+'─'.repeat(48),
    `  Base             ${plan.base}`,
    `  Changed files    ${plan.summary.changed}`,
    `  Source files     ${plan.summary.scannedFiles} scanned`,
    `  Test files       ${plan.summary.totalTests} found`,
    `  Related tests    ${plan.summary.affectedTests}`,
    '', '  '+color('RECOMMENDATION','dim',c),
    '  '+color(modeText,tone,c)+'  ['+plan.decision.reason+']',''
  ];
  if(plan.risks.length){
    lines.push('  '+color('RISK SIGNALS','dim',c));
    for(const risk of plan.risks.slice(0,12))lines.push(`  ${color('!',risk.severity==='critical'?'red':'yellow',c)} ${risk.code}  ${risk.path}`);
    if(plan.risks.length>12)lines.push(`  … and ${plan.risks.length-12} more`);
    lines.push('');
  }
  if(mode==='targeted'){
    lines.push('  '+color('SUGGESTED TEST FILES','dim',c));
    for(const path of plan.affectedTests)lines.push(`  → ${path}`);
    lines.push('');
  }
  if(plan.diagnostics.length){
    lines.push('  '+color('GRAPH LIMITATIONS (first 5)','dim',c));
    for(const item of plan.diagnostics.slice(0,5))lines.push(`  ? ${item.path}: ${item.reason}`);
    lines.push('');
  }
  lines.push('  '+color('Advisory only. Full release/merge CI checks remain necessary.','dim',c));
  return lines.join('\n')+'\n';
}
