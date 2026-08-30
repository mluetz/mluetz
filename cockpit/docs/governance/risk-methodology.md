# Risikomethodik

**Dokument:** Governance – Bewertungs- und Behandlungsmethodik
**Anwendung:** ICT & Third Party Risk Management Cockpit
**Status:** Freigegeben | **Version:** 1.0 | **Stand:** 2026-08

---

## 1. Grundprinzip

Das Cockpit verwendet eine 5×5-Risikomatrix. Jedes Risiko wird durch Eintrittswahrscheinlichkeit (Likelihood) und Auswirkung (Impact) auf jeweils fünfstufigen Skalen bewertet. Aus beiden Werten werden inhärenter und – unter Berücksichtigung der Kontrollwirksamkeit – residualer Risikoscore berechnet. Alle Bewertungen werden als RiskAssessment versioniert gespeichert; Änderungen sind über den AuditLog nachvollziehbar.

## 2. Likelihood-Skala (Eintrittswahrscheinlichkeit)

| Stufe | Bezeichnung    | Beschreibung (Orientierung)                                                          |
| ----- | -------------- | ------------------------------------------------------------------------------------ |
| 1     | Rare           | Eintritt nur unter außergewöhnlichen Umständen; seltener als alle 10 Jahre erwartbar |
| 2     | Unlikely       | Eintritt möglich, aber nicht erwartet; etwa alle 5–10 Jahre                          |
| 3     | Possible       | Eintritt unter normalen Umständen denkbar; etwa alle 2–5 Jahre                       |
| 4     | Likely         | Eintritt wahrscheinlich; etwa jährlich                                               |
| 5     | Almost Certain | Eintritt nahezu sicher; mehrfach pro Jahr bzw. bereits wiederholt eingetreten        |

Die Frequenzangaben sind Orientierungswerte; maßgeblich ist die begründete Einschätzung im Self Assessment.

## 3. Impact-Skala (Auswirkung)

| Stufe | Bezeichnung   | Beschreibung (Orientierung)                                                                                           |
| ----- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1     | Insignificant | Vernachlässigbare Auswirkung; keine Außenwirkung, keine Beeinträchtigung von Funktionen                               |
| 2     | Minor         | Geringe, lokal begrenzte Auswirkung; kurzfristig behebbar, keine regulatorische Relevanz                              |
| 3     | Moderate      | Spürbare Auswirkung; temporäre Beeinträchtigung von Prozessen, ggf. Meldepflicht zu prüfen                            |
| 4     | Major         | Erhebliche Auswirkung; Beeinträchtigung wichtiger Funktionen, regulatorische Konsequenzen wahrscheinlich              |
| 5     | Severe        | Schwerwiegende Auswirkung; Ausfall kritischer oder wichtiger Funktionen, erheblicher finanzieller/reputativer Schaden |

## 4. Auswirkungsdimensionen

Der Impact ist über alle relevanten Dimensionen zu würdigen; der Gesamtimpact entspricht der höchsten Einzelbewertung (Worst-Case-Prinzip). Die Dimensionen werden je Bewertung dokumentiert:

- Vertraulichkeit, Integrität, Verfügbarkeit, Authentizität (Schutzziele)
- Finanziell
- Regulatorisch
- Kunde
- Reputation
- Betriebsunterbrechung
- Datenschutz
- Kritische/wichtige Funktionen (DORA-Bezug; Verknüpfung zur Entität CriticalFunction)

## 5. Berechnungsformeln

### 5.1 Inhärentes Risiko

```
Inherent = Likelihood × Impact          (Wertebereich 1–25)
```

### 5.2 Residualrisiko

```
Residual = round(Inherent × (1 − Effectiveness × M)),  mindestens 1
```

- **Effectiveness** ∈ {0; 0,25; 0,5; 0,75; 1,0} – aggregierte Wirksamkeit der zugeordneten Kontrollen aus dem jeweils aktuellen ControlAssessment.
- **M (Mitigationsfaktor)** = 0,9 (Standard, konfigurierbar über AppSetting). Der Faktor < 1 stellt methodisch sicher, dass eine Kontrolle ein Risiko nie vollständig eliminiert: auch bei Effectiveness = 1,0 verbleibt ein Restrisiko von mindestens 10 % des inhärenten Wertes (bzw. min. 1).
- Rundung: kaufmännisch; Untergrenze 1.

### 5.3 Beispielrechnung

Risiko „Ausfall des zentralen Cloud-Dienstleisters":

- Likelihood = 3 (Possible), Impact = 5 (Severe, Dimension Betriebsunterbrechung/kritische Funktion)
- **Inherent = 3 × 5 = 15 → High**
- Zugeordnete Kontrollen (Redundanz, Exit-Strategie, Monitoring) mit Effectiveness = 0,75
- **Residual = round(15 × (1 − 0,75 × 0,9)) = round(15 × 0,325) = round(4,875) = 5 → Medium**

## 6. Klassifikation

| Score | Klassifikation |
| ----- | -------------- |
| 1–4   | Low            |
| 5–9   | Medium         |
| 10–16 | High           |
| 17–25 | Critical       |

Die Grenzwerte sind über AppSetting konfigurierbar. Änderungen an Klassifikationsgrenzen oder am Mitigationsfaktor wirken prospektiv, werden im AuditLog protokolliert und sind im Management-Reporting kenntlich zu machen. Historische Assessments werden nicht rückwirkend neu klassifiziert.

## 7. Risikoappetit

- Der Risikoappetit wird als Schwellwert (Score 1–25) **je Risikokategorie** (RiskCategory) definiert und vom Management freigegeben.
- Liegt das Residualrisiko **über** dem Appetit der Kategorie, ist eine Behandlung (Reduce/Avoid/Transfer) oder eine formale, befristete Akzeptanz (Abschnitt 8) zwingend; ein Verbleib ohne Entscheidung ist nicht zulässig.
- Liegt das Residualrisiko **innerhalb** des Appetits, genügt reguläres Monitoring mit periodischer Neubewertung.
- Appetit-Überschreitungen werden im Cockpit visuell markiert und im Reporting aggregiert ausgewiesen.

## 8. Behandlungsstrategien

| Strategie    | Beschreibung                                                                   | Umsetzung im Cockpit                                                       |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Avoid**    | Risikoquelle beseitigen (Aktivität, Asset oder Dienstleisterbeziehung beenden) | Maßnahme(n) zur Beendigung; bei Drittparteien Verknüpfung mit ExitStrategy |
| **Reduce**   | Wahrscheinlichkeit/Auswirkung durch Kontrollen und Maßnahmen senken            | Zuordnung von Controls, Maßnahmen (Action) mit Owner und Termin            |
| **Transfer** | Risiko ganz/teilweise übertragen (Versicherung, vertragliche Regelung)         | Dokumentation im Risiko und im Contract; Restrisiko bleibt zu bewerten     |
| **Accept**   | Bewusste, befristete Übernahme des Restrisikos                                 | Formaler Akzeptanzprozess (Abschnitt 9)                                    |

Die gewählte Strategie ist im Risiko zu dokumentieren und zu begründen; ein Wechsel der Strategie durchläuft erneut das Quality Review.

## 9. Akzeptanzprozess (RiskAcceptance)

Workflow: **Request → Bewertung → Appetit-Prüfung → kompensierende Kontrollen → Managementfreigabe → befristete Akzeptanz → Review → Verlängerung/Ende**

1. **Request:** Risk Owner beantragt die Akzeptanz mit Begründung und beantragter Laufzeit.
2. **Bewertung:** ICT Risk Manager (bzw. Third Party Risk Manager bei Drittparteibezug) prüft die aktuelle Bewertung auf Plausibilität und Aktualität.
3. **Appetit-Prüfung:** Automatischer Abgleich des Residualscores gegen den Appetit der Risikokategorie; das Ergebnis (innerhalb/oberhalb) wird im Antrag dokumentiert.
4. **Kompensierende Kontrollen:** Bei Überschreitung des Appetits sind kompensierende Kontrollen oder risikomindernde Auflagen zu benennen und als Controls/Actions zu verknüpfen.
5. **Managementfreigabe:** Zwingende Freigabe durch die Rolle Management (Approval-Datensatz, Vier-Augen-Prinzip; Antragsteller ≠ Genehmiger).
6. **Befristung:** Jede Akzeptanz ist befristet (Standard-Höchstlaufzeit 12 Monate, konfigurierbar). Unbefristete Akzeptanzen sind nicht vorgesehen.
7. **Review/Wiedervorlage:** Vor Fristablauf erzeugt das Cockpit eine Notification zur Wiedervorlage. Ergebnisoptionen: Verlängerung (erneuter vollständiger Durchlauf ab Schritt 2), Überführung in Behandlung oder Ende der Akzeptanz.
8. **Ablauf ohne Entscheidung:** Läuft eine Akzeptanz ohne Review ab, gilt sie als beendet; das Risiko fällt in den Status Open/Treatment zurück und wird im Reporting als überfällig ausgewiesen.

## 10. Bewertungsanlässe und Turnus

- Erstbewertung bei Erfassung; Re-Assessment mindestens jährlich, bei Critical-Risiken halbjährlich (konfigurierbar).
- Anlassbezogene Neubewertung bei: wesentlichen Änderungen an Assets/IctServices/Drittparteien, Vorfällen, ineffektiven Kontrollen (ControlAssessment „Ineffective"), Vertragsänderungen, Ergebnis von Runbook-/Playbook-Executions mit Risikobezug.

---

_Die Anwendung unterstützt die Dokumentation und Steuerung regulatorischer Anforderungen. Sie ersetzt keine rechtliche, aufsichtsrechtliche oder unabhängige Compliance-Prüfung._
