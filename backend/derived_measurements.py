"""Approved-rule arithmetic engine. No clinical formulas are bundled."""
import json
import math
import os

def is_derived(path):
    key = path[-1].lower()
    return key in ('mpi', 'pi', 'mv_e_a', 'mitral_e_a', 'tricuspid_e_a') or key.endswith(('_mpi', '_pi', '_tdimpi', '_e_e'))

def rules():
    filename = os.environ.get('ECHOAI_CALCULATION_RULES')
    if not filename:
        return []
    with open(filename) as handle:
        definitions = json.load(handle)
    if not isinstance(definitions, list):
        raise ValueError('Calculation rules must be a list')
    for rule in definitions:
        if not all(rule.get(k) for k in ('id', 'output', 'expression', 'approved_by', 'reference', 'version')):
            raise ValueError('Calculation rules require approval, reference, version, output and expression')
    return definitions

def lookup(report, path):
    value = report
    for part in path:
        value = value.get(part) if isinstance(value, dict) else None
    return value

def evaluate(node, report, depth=0):
    if depth > 20:
        raise ValueError('Rule nesting limit exceeded')
    if 'input' in node:
        value = lookup(report, node['input'])
        if value is None or value == '' or isinstance(value, bool):
            raise ValueError('Missing input')
        value = float(value)
    elif 'constant' in node:
        value = float(node['constant'])
    else:
        args = [evaluate(arg, report, depth + 1) for arg in node.get('args', [])]
        if len(args) != 2:
            raise ValueError('Two arithmetic arguments required')
        op = node.get('op')
        if op == 'add': value = args[0] + args[1]
        elif op == 'subtract': value = args[0] - args[1]
        elif op == 'multiply': value = args[0] * args[1]
        elif op == 'divide': value = args[0] / args[1]
        else: raise ValueError('Unknown arithmetic operation')
    if not math.isfinite(value):
        raise ValueError('Non-finite result')
    return value

def recalculate(report, scan_type):
    approved = {'.'.join(r['output']): r for r in rules() if r.get('scan_type') in (None, scan_type)}
    states = {}
    def walk(node, path=()):
        for key, value in list(node.items()):
            if key.startswith('_derived'):
                continue
            current = (*path, key)
            if isinstance(value, dict):
                walk(value, current)
            elif is_derived(current):
                name = '.'.join(current)
                rule = approved.get(name)
                # Preserve historical/manual values separately; never present them as calculated.
                if not rule:
                    if value not in (None, ''):
                        report.setdefault('_derived_legacy', {}).setdefault(name, value)
                    node[key] = ''
                    states[name] = {'status': 'Awaiting approved formula'}
                    continue
                try:
                    node[key] = str(round(evaluate(rule['expression'], report), rule.get('precision', 4)))
                    states[name] = {'status': 'Calculated', 'rule': rule['id'], 'version': rule['version']}
                except (ValueError, TypeError, ZeroDivisionError, OverflowError):
                    node[key] = ''
                    states[name] = {'status': 'Unavailable — check source inputs', 'rule': rule['id'], 'version': rule['version']}
    walk(report)
    report['_derived_status'] = states
    return report
